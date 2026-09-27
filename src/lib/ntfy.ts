// Sends a push notification via ntfy.sh. No API key needed — anyone who
// knows the topic name can publish or subscribe, which is why .env.example
// asks for an unguessable topic rather than something like "miguel-tracker".
//
// Published as JSON rather than with a `Title:` header: HTTP headers must be
// Latin-1, so a Canvas title with a curly apostrophe (’) made fetch throw
// and took the whole notify run down with it.
export async function sendNtfy(title: string, message: string) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  const res = await fetch("https://ntfy.sh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, title, message }),
  });
  if (!res.ok) throw new Error(`ntfy publish failed: ${res.status}`);
}
