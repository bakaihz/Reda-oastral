import { fetch } from "undici";

async function testKey() {
  const url = "https://sedintegracoes.educacao.sp.gov.br/saladofuturobffapi/credenciais/api/LoginCompletoToken";
  const key = "d701a2043aa24d7ebb37e9adf60d043b";
  
  console.log("Testing key:", key);
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "ocp-apim-subscription-key": key,
        "referer": "https://saladofuturo.educacao.sp.gov.br/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({
        user: "123456789sp",
        senha: "password123"
      })
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
    
  } catch (e) {
    console.error(e);
  }
}

testKey();
