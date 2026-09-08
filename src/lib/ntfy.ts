// Sends a push notification via ntfy.sh. No API key needed — anyone who
// knows the topic name can publish or subscribe, which is why .env.example
// asks for an unguessable topic rather than something like "miguel-tracker".
export async function sendNtfy(title: string, message: string) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: { Title: title },
    body: message,
  });
}
