import { FetchClient, Config } from 'coze-coding-dev-sdk';

async function main() {
  const config = new Config();
  const client = new FetchClient(config);
  
  const response = await client.fetch('https://my.feishu.cn/wiki/Qj07wusE0ijXm0k9KV0c7AqsnUb');
  
  console.log('Title:', response.title);
  console.log('Status:', response.status_code);
  console.log('---Content---');
  
  for (const item of response.content) {
    if (item.type === 'text') {
      console.log(item.text);
    }
  }
}

main().catch(console.error);
