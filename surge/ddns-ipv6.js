// ddns-ipv6.js
// Surge 脚本：每次都以 Cloudflare 上的实际 AAAA 记录为准进行比对，不一致则更新

const CF_API_TOKEN = "你的_Cloudflare_API_Token";
const CF_ZONE_ID = "你的_Zone_ID";
const RECORD_NAME = "home.example.com";
const TTL = 120;
const PROXIED = false;

const MAX_RETRY = 6;
const RETRY_DELAY = 5000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function notify(title, body) {
  $notification.post(title, "", body);
}

// 统一为完整小写格式，避免 "2001:db8::1" 与 "2001:0db8:0000:...:0001" 被误判为不同
function normalizeIPv6(ip) {
  if (!ip) return "";
  let addr = ip.split("%")[0].toLowerCase();
  let parts;
  if (addr.includes("::")) {
    const [head, tail] = addr.split("::");
    const h = head ? head.split(":") : [];
    const t = tail ? tail.split(":") : [];
    const fill = 8 - h.length - t.length;
    parts = [...h, ...Array(fill).fill("0"), ...t];
  } else {
    parts = addr.split(":");
  }
  return parts.map(p => p.padStart(4, "0")).join(":");
}

function getIPv6() {
  const addr = $network && $network.v6 && $network.v6.primaryAddress;
  if (!addr || addr.toLowerCase().startsWith("fe80")) return null;
  return addr;
}

async function getIPv6WithRetry() {
  for (let i = 0; i < MAX_RETRY; i++) {
    const ip = getIPv6();
    if (ip) return ip;
    console.log(`[DDNS] 第 ${i + 1} 次未获取到 IPv6，等待重试`);
    await sleep(RETRY_DELAY);
  }
  return null;
}

function cfRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://api.cloudflare.com/client/v4${path}`,
      headers: {
        "Authorization":e 上的实际 AAAA 记录为准进行比对，不一致则更
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined,
      timeout: 15
    };
    const handler = (err, resp, data) => {
      if (err) return reject(err);
      try {
        const json = JSON.parse(data);
        if (!json.success) return reject(new Error(JSON.stringify(json.errors)));
        resolve(json);
      } catch (e) {
        reject(e);
      }
    };
    if (method === "GET") $httpClient.get(options, handler);
    else if (method === "PUT") $httpClient.put(options, handler);
    else if (method === "POST") $httpClient.post(options, handler);
  });
}

async function findRecord() {
  const res = await cfRequest(
    "GET",
   ad ? head.split(":") : [];
    const t = tail ? tail.split(":") : [];
    const fill =  );
  return res.result && res.result[0];
}

// 返回 true 表示进行了更新，false 表示远端已一致
async function syncRecord(ip) {
  const existing = await findRecord();  // 每次都查询 Cloudflare 实际记录
  const payload = { type: "AAAA", name: RECORD_NAME, content: ip, ttl: TTL, proxied: PROXIED };

  if (existing) {
    const remote = normalizeIPv6(existing.content);
    const local = normalizeIPv6(ip);
    console.log(`[DDNS] 远端: ${remote} | 本机: ${local}`);
    if (remote === local) return false;
    await cfRequest("PUT",unction normalizeIPv6(ip) {
  if (!ip) return "";
  payload);
  } else {
    await cfRequest("POST",AAAA 记录为准进行比对，不一致则更新

const CF_API_T payload);
  }
  return true;
}

(async () => {
  try {
    const ip = await getIPv6WithRetry();
    if (!ip) {
      console.log("[DDNS] 多次重试仍无公网 IPv6，跳过");
      $done();
      return;
    }

    const changed = await syncRecord(ip);
    if (changed) {
      console.log(`[DDNS] 已更新 ${RECORD_NAME} -> ${ip}`);
      notify("DDNS 已更新", `${RECORD_NAME} → ${ip}`);
    } else {
      console.log(`[DDNS] 远端记录已与本机一致：${ip}`);
    }
  } catch (e) {
    console.log(`[DDNS] 失败：${e.message || e}`);
    notify("DDNS 更新失败", String(e.message || e));
  } finally {
    $done();
  }
})();
