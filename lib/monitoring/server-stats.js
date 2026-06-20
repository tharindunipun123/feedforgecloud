import { Client } from 'ssh2';

function execSSH(credentials, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';

    conn
      .on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }
          stream
            .on('close', () => {
              conn.end();
              resolve(output.trim());
            })
            .on('data', (data) => {
              output += data.toString();
            })
            .stderr.on('data', (data) => {
              output += data.toString();
            });
        });
      })
      .on('error', reject)
      .connect({
        host: credentials.ip,
        port: parseInt(credentials.sshPort, 10) || 22,
        username: credentials.username || 'root',
        password: credentials.password,
        readyTimeout: 12000,
        tryKeyboard: false,
      });
  });
}

function parseCpuUsage(topOutput) {
  const idleMatch = topOutput.match(/%Cpu\(s\):\s*[\d.]+\s+us,\s*[\d.]+\s+sy,\s*[\d.]+\s+ni,\s*([\d.]+)\s+id/);
  if (idleMatch) {
    return Math.round(100 - parseFloat(idleMatch[1]));
  }
  const loadMatch = topOutput.match(/load average:\s*([\d.]+)/);
  if (loadMatch) {
    return Math.min(100, Math.round(parseFloat(loadMatch[1]) * 25));
  }
  return null;
}

function parseMemoryUsage(freeOutput) {
  const lines = freeOutput.split('\n');
  const memLine = lines.find((l) => l.startsWith('Mem:'));
  if (!memLine) return null;
  const parts = memLine.split(/\s+/).filter(Boolean);
  const total = parseInt(parts[1], 10);
  const used = parseInt(parts[2], 10);
  if (!total || !used) return null;
  return Math.round((used / total) * 100);
}

function parseDiskUsage(dfOutput) {
  const lines = dfOutput.split('\n').filter((l) => l.includes('%'));
  const rootLine = lines.find((l) => /\/\s*$/.test(l) || l.endsWith(' /'));
  const line = rootLine || lines[0];
  if (!line) return null;
  const match = line.match(/(\d+)%/);
  return match ? parseInt(match[1], 10) : null;
}

export async function fetchServerStats(credentials) {
  const script = `
top -bn1 | head -5
echo "---SPLIT---"
free -m | head -2
echo "---SPLIT---"
df -h / | tail -1
echo "---SPLIT---"
cat /proc/net/dev 2>/dev/null | grep -E 'eth0|ens' | head -1 || echo "0 0 0 0"
`.trim();

  const raw = await execSSH(credentials, script);
  const [topOut, freeOut, dfOut, netOut] = raw.split('---SPLIT---').map((s) => s.trim());

  const cpu = parseCpuUsage(topOut) ?? 0;
  const mem = parseMemoryUsage(freeOut) ?? 0;
  const storage = parseDiskUsage(dfOut) ?? 0;

  let bw = 0;
  const netParts = netOut?.split(/\s+/).filter(Boolean);
  if (netParts?.length >= 10) {
    const rx = parseInt(netParts[1], 10) || 0;
    const tx = parseInt(netParts[9], 10) || 0;
    const totalMb = (rx + tx) / (1024 * 1024);
    bw = Math.min(100, Math.round(totalMb / 10));
  }

  return {
    cpu,
    mem,
    storage,
    bw,
    fetchedAt: new Date().toISOString(),
    source: 'ssh',
  };
}
