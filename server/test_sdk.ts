import { LLMClient, Config } from 'coze-coding-dev-sdk';

const config = new Config();
const client = new LLMClient(config);

async function test() {
  try {
    const messages = [{ role: 'user', content: '你好，你是什么？' }];
    const response = await client.invoke(messages, { temperature: 0.7 });
    console.log('Response:', response.content);
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Response:', error.response?.data);
  }
}

test();
