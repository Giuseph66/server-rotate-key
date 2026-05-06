import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const modelsToTest = [
  'gpt-5.3-codex',
];

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { chatgptAccessToken: { not: null } }
  });

  if (!tenant || !tenant.chatgptAccessToken) {
    console.error('No tenant with a ChatGPT Access Token found in DB. Please authenticate via the UI first.');
    return;
  }

  const token = tenant.chatgptAccessToken;
  console.log(`Testing Codex Endpoint for Tenant: ${tenant.name} (ID: ${tenant.id})`);

  for (const model of modelsToTest) {
    console.log(`\nTesting model: ${model}...`);
    try {
      const response = await fetch('https://chatgpt.com/backend-api/codex/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(tenant.chatgptAccountId ? { 'chatgpt-account-id': tenant.chatgptAccountId } : {}),
        },
        body: JSON.stringify({
          model: model,
          store: false,
          instructions: 'You are a helpful assistant.',
          input: [
            { role: 'user', content: [{ type: 'input_text', text: 'hi' }] }
          ],
          stream: true,
        })
      });

      if (response.ok) {
        console.log(`✅ SUCCESS: ${model} is supported (Streaming ok)!`);
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let count = 0;
          while (count < 20) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            console.log(`Chunk ${count}:`, text);
            count++;
          }
          await reader.cancel();
        }
      } else {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const json = JSON.parse(errorText);
          errorMessage = json.detail || json.message || errorText;
        } catch (e) {}
        console.log(`❌ FAILED: ${model} -> ${response.status} ${errorMessage}`);
      }
    } catch (e: any) {
      console.log(`❌ NETWORK ERROR: ${model} -> ${e.message}`);
    }
    
    // Add a small delay to avoid rate limits during the test
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
