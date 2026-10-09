use std::io::{self, BufRead, Write};

use serde_json::{Value, json};

fn reply(request: &Value) -> Value {
    let id = request.get("id").cloned().unwrap_or(Value::Null);
    if request.get("jsonrpc").and_then(Value::as_str) != Some("2.0") {
        return json!({"jsonrpc":"2.0","id":id,"error":{"code":-32600,"message":"Invalid JSON-RPC request"}});
    }
    match request.get("method").and_then(Value::as_str) {
        Some("engine.health") => json!({"jsonrpc":"2.0","id":id,"result":{
            "version":env!("CARGO_PKG_VERSION"),
            "network":std::env::var("RINGSIDE_ENGINE_NETWORK").or_else(|_| std::env::var("RINGSIDE_NETWORK")).unwrap_or_else(|_| "devnet".into()),
            "tier":"C",
            "available":false,
            "swap_program_id":null,
            "escrow_program_id":null,
            "keys_ok":false
        }}),
        _ => json!({"jsonrpc":"2.0","id":id,"error":{"code":-32001,"message":"ENGINE_UNAVAILABLE: swap and escrow proving are not available in Tier C"}}),
    }
}

fn main() -> io::Result<()> {
    let mut args = std::env::args().skip(1);
    match args.next().as_deref() {
        Some("serve") => {
            let stdin = io::stdin();
            let mut stdout = io::stdout().lock();
            for line in stdin.lock().lines() {
                let line = line?;
                let result = match serde_json::from_str::<Value>(&line) {
                    Ok(request) => reply(&request),
                    Err(_) => json!({"jsonrpc":"2.0","id":null,"error":{"code":-32700,"message":"Invalid JSON"}}),
                };
                writeln!(stdout, "{result}")?;
                stdout.flush()?;
            }
        }
        Some("health") => println!("{}", reply(&json!({"jsonrpc":"2.0","id":1,"method":"engine.health"}))),
        _ => {
            eprintln!("Usage: ringside-engine serve|health");
            std::process::exit(2);
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tier_c_never_executes_spend_methods() {
        let result = reply(&json!({"jsonrpc":"2.0","id":4,"method":"escrow.lock","params":{"keypair":"secret"}}));
        assert_eq!(result["error"]["code"], -32001);
        assert!(!result.to_string().contains("secret"));
    }
}
