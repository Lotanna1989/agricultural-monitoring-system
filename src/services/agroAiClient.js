export async function queryLocalAgroAI(prompt) {
  try {
    const response = await fetch('http:192.168.43.100:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tinyllama', prompt, stream: false })
    });

    if (!response.ok) throw new Error('TinyLLaMA error');

    const data = await response.json();
    return data.response?.trim() || '🤷🏽 TinyLLaMA gave no response.';
  } catch (err) {
    console.error('AgroAI TinyLLaMA error:', err);
    return '⚠️ TinyLLaMA not available.';
  }
}
