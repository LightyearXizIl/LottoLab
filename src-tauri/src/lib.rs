use chrono::Utc;
use reqwest::Client;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

const CWL_SOURCE: &str = "中国福彩网官方开奖接口";
const SPORTTERY_SOURCE: &str = "中国体彩官方开奖接口";

#[derive(Clone)]
struct Database {
    path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DrawRecord {
    id: Option<i64>,
    game: String,
    issue: String,
    draw_date: String,
    primary_numbers: Vec<u8>,
    secondary_numbers: Vec<u8>,
    sales_yuan: Option<f64>,
    pool_yuan: Option<f64>,
    source: String,
    fetched_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SyncReport {
    game: String,
    inserted: usize,
    updated: usize,
    total: usize,
    source: String,
    synced_at: String,
    status: String,
    message: Option<String>,
}

fn app_database_path(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    Ok(path.join("lottolab.sqlite3"))
}

fn open_database(path: &PathBuf) -> Result<Connection, String> {
    let connection = Connection::open(path).map_err(|error| error.to_string())?;
    connection.execute_batch("PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS draws (id INTEGER PRIMARY KEY, game TEXT NOT NULL, issue TEXT NOT NULL, draw_date TEXT NOT NULL, primary_numbers TEXT NOT NULL, secondary_numbers TEXT NOT NULL, sales_yuan REAL, pool_yuan REAL, source TEXT NOT NULL, fetched_at TEXT NOT NULL, UNIQUE(game, issue));
      CREATE TABLE IF NOT EXISTS saved_runs (id INTEGER PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL);")
        .map_err(|error| error.to_string())?;
    Ok(connection)
}

fn parse_numbers(value: &str, expected: usize, max: u8) -> Result<Vec<u8>, String> {
    let mut numbers: Vec<u8> = value
        .split(|character: char| !character.is_ascii_digit())
        .filter(|item| !item.is_empty())
        .map(|item| {
            item.parse::<u8>()
                .map_err(|_| format!("无法解析号码：{item}"))
        })
        .collect::<Result<Vec<_>, _>>()?;
    numbers.sort_unstable();
    numbers.dedup();
    if numbers.len() != expected || numbers.iter().any(|number| *number == 0 || *number > max) {
        return Err("开奖结果不符合当前玩法号码规则".into());
    }
    Ok(numbers)
}

fn date_only(value: &str) -> String {
    value.chars().take(10).collect()
}
fn number_value(value: Option<&Value>) -> Option<f64> {
    value
        .and_then(|item| item.as_str())
        .and_then(|item| item.replace(',', "").parse::<f64>().ok())
        .or_else(|| value.and_then(Value::as_f64))
}
fn validate_game(game: &str) -> Result<(), String> {
    if matches!(game, "ssq" | "dlt") {
        Ok(())
    } else {
        Err("仅支持 ssq 或 dlt".into())
    }
}

fn validate_draw(draw: &DrawRecord) -> Result<(), String> {
    let (primary_count, primary_max, secondary_count, secondary_max) = match draw.game.as_str() {
        "ssq" => (6, 33, 1, 16),
        "dlt" => (5, 35, 2, 12),
        _ => return Err("未知彩种".into()),
    };
    if draw.issue.trim().is_empty() || draw.draw_date.len() != 10 {
        return Err("期号或日期无效".into());
    }
    if draw.primary_numbers.len() != primary_count
        || draw.secondary_numbers.len() != secondary_count
    {
        return Err("号码数量无效".into());
    }
    if draw
        .primary_numbers
        .windows(2)
        .any(|pair| pair[0] >= pair[1])
        || draw
            .secondary_numbers
            .windows(2)
            .any(|pair| pair[0] >= pair[1])
    {
        return Err("号码必须升序且不重复".into());
    }
    if draw
        .primary_numbers
        .iter()
        .any(|number| *number == 0 || *number > primary_max)
        || draw
            .secondary_numbers
            .iter()
            .any(|number| *number == 0 || *number > secondary_max)
    {
        return Err("号码超出玩法范围".into());
    }
    Ok(())
}

async fn fetch_cwl(client: &Client) -> Result<Vec<DrawRecord>, String> {
    let mut page = 1usize;
    let mut pages = 1usize;
    let mut draws = Vec::new();
    while page <= pages {
        let url = format!("https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=&issueStart=&issueEnd=&dayStart=&dayEnd=&pageNo={page}&pageSize=100&week=&systemType=PC");
        let payload: Value = client
            .get(url)
            .header("Referer", "https://www.cwl.gov.cn/")
            .send()
            .await
            .map_err(|error| error.to_string())?
            .error_for_status()
            .map_err(|error| error.to_string())?
            .json()
            .await
            .map_err(|error| error.to_string())?;
        if payload.get("state").and_then(Value::as_i64) != Some(0) {
            return Err("中国福彩网返回了非成功状态".into());
        }
        pages = payload.get("pageNum").and_then(Value::as_u64).unwrap_or(1) as usize;
        for item in payload
            .get("result")
            .and_then(Value::as_array)
            .ok_or("中国福彩网响应缺少 result")?
        {
            let red = item
                .get("red")
                .and_then(Value::as_str)
                .ok_or("中国福彩网响应缺少 red")?;
            let blue = item
                .get("blue")
                .and_then(Value::as_str)
                .ok_or("中国福彩网响应缺少 blue")?;
            draws.push(DrawRecord {
                id: None,
                game: "ssq".into(),
                issue: item
                    .get("code")
                    .and_then(Value::as_str)
                    .ok_or("中国福彩网响应缺少 code")?
                    .into(),
                draw_date: date_only(
                    item.get("date")
                        .and_then(Value::as_str)
                        .ok_or("中国福彩网响应缺少 date")?,
                ),
                primary_numbers: parse_numbers(red, 6, 33)?,
                secondary_numbers: parse_numbers(blue, 1, 16)?,
                sales_yuan: number_value(item.get("sales")),
                pool_yuan: number_value(item.get("poolmoney")),
                source: CWL_SOURCE.into(),
                fetched_at: Utc::now().to_rfc3339(),
            });
        }
        page += 1;
    }
    Ok(draws)
}

async fn fetch_sporttery(client: &Client) -> Result<Vec<DrawRecord>, String> {
    let mut page = 1usize;
    let mut pages = 1usize;
    let mut draws = Vec::new();
    while page <= pages {
        let url = format!("https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=85&provinceId=0&pageSize=100&isVerify=1&pageNo={page}");
        let payload: Value = client
            .get(url)
            .header("Referer", "https://static.sporttery.cn/")
            .send()
            .await
            .map_err(|error| error.to_string())?
            .error_for_status()
            .map_err(|error| error.to_string())?
            .json()
            .await
            .map_err(|error| error.to_string())?;
        if payload.get("success").and_then(Value::as_bool) != Some(true) {
            return Err("中国体彩接口返回了非成功状态".into());
        }
        let value = payload.get("value").ok_or("中国体彩响应缺少 value")?;
        pages = value.get("pages").and_then(Value::as_u64).unwrap_or(1) as usize;
        let list = value
            .get("list")
            .and_then(Value::as_array)
            .ok_or("中国体彩响应缺少 list")?;
        for item in list {
            let result = item
                .get("lotteryDrawResult")
                .and_then(Value::as_str)
                .ok_or("中国体彩响应缺少 lotteryDrawResult")?;
            let values: Vec<&str> = result.split_whitespace().collect();
            if values.len() != 7 {
                return Err("中国体彩开奖结果号码数量异常".into());
            }
            draws.push(DrawRecord {
                id: None,
                game: "dlt".into(),
                issue: item
                    .get("lotteryDrawNum")
                    .and_then(Value::as_str)
                    .ok_or("中国体彩响应缺少 lotteryDrawNum")?
                    .into(),
                draw_date: date_only(
                    item.get("lotteryDrawTime")
                        .and_then(Value::as_str)
                        .ok_or("中国体彩响应缺少 lotteryDrawTime")?,
                ),
                primary_numbers: parse_numbers(&values[..5].join(" "), 5, 35)?,
                secondary_numbers: parse_numbers(&values[5..].join(" "), 2, 12)?,
                sales_yuan: number_value(item.get("totalSaleAmount")),
                pool_yuan: number_value(item.get("poolBalanceAfterdraw")),
                source: SPORTTERY_SOURCE.into(),
                fetched_at: Utc::now().to_rfc3339(),
            });
        }
        if list.is_empty() {
            break;
        }
        page += 1;
    }
    Ok(draws)
}

fn persist_draws(database: &Database, draws: &[DrawRecord]) -> Result<(), String> {
    let mut connection = open_database(&database.path)?;
    let transaction = connection
        .transaction()
        .map_err(|error| error.to_string())?;
    for draw in draws {
        validate_draw(draw)?;
        transaction.execute("INSERT INTO draws (game, issue, draw_date, primary_numbers, secondary_numbers, sales_yuan, pool_yuan, source, fetched_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9) ON CONFLICT(game, issue) DO UPDATE SET draw_date=excluded.draw_date, primary_numbers=excluded.primary_numbers, secondary_numbers=excluded.secondary_numbers, sales_yuan=excluded.sales_yuan, pool_yuan=excluded.pool_yuan, source=excluded.source, fetched_at=excluded.fetched_at", params![draw.game, draw.issue, draw.draw_date, serde_json::to_string(&draw.primary_numbers).map_err(|error| error.to_string())?, serde_json::to_string(&draw.secondary_numbers).map_err(|error| error.to_string())?, draw.sales_yuan, draw.pool_yuan, draw.source, draw.fetched_at]).map_err(|error| error.to_string())?;
    }
    transaction.commit().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn list_draws(
    game: String,
    limit: usize,
    database: State<Database>,
) -> Result<Vec<DrawRecord>, String> {
    validate_game(&game)?;
    let connection = open_database(&database.path)?;
    let mut statement = connection.prepare("SELECT id, game, issue, draw_date, primary_numbers, secondary_numbers, sales_yuan, pool_yuan, source, fetched_at FROM draws WHERE game=?1 ORDER BY draw_date DESC, issue DESC LIMIT ?2").map_err(|error| error.to_string())?;
    let rows = statement
        .query_map(params![game, limit.min(5000)], |row| {
            Ok(DrawRecord {
                id: row.get(0)?,
                game: row.get(1)?,
                issue: row.get(2)?,
                draw_date: row.get(3)?,
                primary_numbers: serde_json::from_str::<Vec<u8>>(&row.get::<_, String>(4)?)
                    .unwrap_or_default(),
                secondary_numbers: serde_json::from_str::<Vec<u8>>(&row.get::<_, String>(5)?)
                    .unwrap_or_default(),
                sales_yuan: row.get(6)?,
                pool_yuan: row.get(7)?,
                source: row.get(8)?,
                fetched_at: row.get(9)?,
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn sync_draws(game: String, database: State<'_, Database>) -> Result<SyncReport, String> {
    validate_game(&game)?;
    let client = Client::builder()
        .user_agent("LottoLab/0.0.2 (local history research)")
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|error| error.to_string())?;
    let draws = if game == "ssq" {
        fetch_cwl(&client).await?
    } else {
        fetch_sporttery(&client).await?
    };
    let total = draws.len();
    let source = if game == "ssq" {
        CWL_SOURCE
    } else {
        SPORTTERY_SOURCE
    };
    persist_draws(&database, &draws)?;
    Ok(SyncReport {
        game,
        inserted: total,
        updated: 0,
        total,
        source: source.into(),
        synced_at: Utc::now().to_rfc3339(),
        status: "success".into(),
        message: Some("已完成官方数据校验与本地事务写入".into()),
    })
}

#[tauri::command]
fn save_recommendation_run(payload: String, database: State<Database>) -> Result<(), String> {
    serde_json::from_str::<Value>(&payload)
        .map_err(|_| "保存内容不是有效的推荐记录".to_string())?;
    let connection = open_database(&database.path)?;
    connection
        .execute(
            "INSERT INTO saved_runs (payload, created_at) VALUES (?1, ?2)",
            params![payload, Utc::now().to_rfc3339()],
        )
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn list_saved_runs(database: State<Database>) -> Result<Vec<String>, String> {
    let connection = open_database(&database.path)?;
    let mut statement = connection
        .prepare("SELECT payload FROM saved_runs ORDER BY created_at DESC LIMIT 100")
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([], |row| row.get(0))
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<String>, _>>()
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("LottoLab: Rust mobile entry started");
    let builder = tauri::Builder::default()
        .setup(|app| {
            println!("LottoLab: initializing application data");
            let database = Database {
                path: app_database_path(app.handle())?,
            };
            open_database(&database.path)?;
            println!("LottoLab: application data ready");
            app.manage(database);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init());
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    println!("LottoLab: starting Tauri event loop");
    builder
        .invoke_handler(tauri::generate_handler![
            list_draws,
            sync_draws,
            save_recommendation_run,
            list_saved_runs
        ])
        .run(tauri::generate_context!())
        .expect("error while running LottoLab");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_and_sorts_valid_numbers() {
        assert_eq!(
            parse_numbers("33,01,14,06,22,04", 6, 33).unwrap(),
            vec![1, 4, 6, 14, 22, 33]
        );
    }

    #[test]
    fn rejects_duplicate_or_out_of_range_numbers() {
        assert!(parse_numbers("01 01 02 03 04 05", 6, 33).is_err());
        assert!(parse_numbers("01 02 03 04 05 34", 6, 33).is_err());
    }

    #[test]
    fn validates_current_game_boundaries() {
        let record = DrawRecord {
            id: None,
            game: "dlt".into(),
            issue: "26093".into(),
            draw_date: "2026-08-17".into(),
            primary_numbers: vec![8, 10, 22, 26, 29],
            secondary_numbers: vec![3, 10],
            sales_yuan: None,
            pool_yuan: None,
            source: "fixture".into(),
            fetched_at: "2026-08-19T00:00:00Z".into(),
        };
        assert!(validate_draw(&record).is_ok());
    }
}
