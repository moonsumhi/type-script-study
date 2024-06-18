function delay(time: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), time));
}

// Q ) Promise.race() 를 사용해본 적이 있나요?
// 제일 먼저 끝나는 애 하나만 가져옴

interface File {
  name: string;
  body: string;
  size: number;
}

function getFile(name: string): Promise<File> {
  return delay(1000, { name, body: "...", size: 100 });
}

export async function main() {
  const file = getFile("file1.png");

  // 몇 초만 기다리고 싶을 때. 너무 오래 기다리면 파일을 주지 않고 싶을 때.
  const result = await Promise.race([file, delay(4000, "timeout")]);

  if (result === "timeout") {
    console.log("로딩");
    console.log(await file);
  } else {
    console.log("즉시 그려라", result);
  }
}
