import got from "got";
import { JSDOM } from "jsdom";

async function extractKey() {
  try {
    console.log("Fetching main page...");
    const response = await got('https://saladofuturo.educacao.sp.gov.br/login', {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"
      }
    });

    const body = response.body;
    
    // Check main HTML body
    const keyRegexHTML = /Ocp-Apim-Subscription-Key["']?\s*:\s*["']([a-fA-F0-9]{32})["']/i;
    const matchHTML = body.match(keyRegexHTML);
    if(matchHTML) {
      console.log("!!! FOUND KEY IN MAIN HTML !!! =>", matchHTML[1]);
    }
    
    const dom = new JSDOM(response.body);
    const scripts = Array.from(dom.window.document.querySelectorAll('script[src]'))
        .map(s => (s as any).src);
    
    console.log("Found scripts:", scripts);
    
    for (let src of scripts) {
      if (src.startsWith('/')) {
         src = 'https://saladofuturo.educacao.sp.gov.br' + src;
      }
      if (!src.startsWith('http')) continue;

      console.log("Fetching:", src);
      try {
        const scriptRes = await got(src, {
          headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"
          }
        });
        const js = scriptRes.body;
        
        const keyRegex = /Ocp-Apim-Subscription-Key["']?\s*:\s*["']([a-fA-F0-9]{32})["']/i;
        const match = js.match(keyRegex);
        if (match) {
          console.log("!!! FOUND KEY !!! =>", match[1]);
        } else {
          // Broad search for any 32 char hex near Ocp-Apim
          const broad = js.match(/Ocp-Apim.{0,50}([a-fA-F0-9]{32})/i);
          if (broad) {
             console.log("!!! FOUND BROAD MATCH !!! =>", broad[1]);
          }
        }
      } catch (e) {
          console.log(`Error fetching ${src}: Ignored.`);
      }
    }
    console.log("Done.");
  } catch(e) {
    console.error("Error:", e);
  }
}

extractKey();
