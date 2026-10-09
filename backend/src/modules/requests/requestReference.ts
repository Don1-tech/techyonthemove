function randomSegment(length: number): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "";

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(
      Math.random() * characters.length
    );

    result += characters[randomIndex];
  }

  return result;
}

export function generateRequestReference(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const datePart = `${year}${month}${day}`;
  const randomPart = randomSegment(6);

  return `TXM-${datePart}-${randomPart}`;
}
