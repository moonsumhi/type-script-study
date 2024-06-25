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

async function concurrent(limit, ps) {
  await Promise.all([ps[0], ps[1], ps[2]]);
  await Promise.all([ps[3], ps[4], ps[5]]);
}

async function concurrent2(limit, ps) {
  await Promise.all([ps[0](), ps[1](), ps[2]()]);
  await Promise.all([ps[3](), ps[4](), ps[5]()]);
}

async function concurrent3(limit: number, fs: (() => Promise<T>)[]){
  const result: T[][] = [];
  // 명령형 코드 : 넘모 무섭다.
  for (let i = 0; i < fs.length / limit; i++;){
    const tmp: Promise<T>[] = [];
    for (let j = 0; j < limit; j++;){
      const f = fs[i*limit+j];
      if (f){
        tmp.push(f());
      }
    }
    result.push(await Promise.all(tmp));
  }
  return result.flat();
}

function* gen(){
  for (let i = 0; i < 4; i++){
    yield i;
  }
}

function* take(length: number, iterable: Iterable<T>){
  const iterator = iterable[Symbol.iterator]();
  while(length-- > 0){
    const {value, done} = iterator.next();
    if (done) break;
    yield value;
  }
}

function* chunk<T>(size: number, iterable: iterable<T>){
  const iterator = iterable[Symbol.iterator]();
  // 언제 끝나야 할지 잘 모를때는 무한루프로 만들자 
  while (true){
    // 만약 yield를 안하는 상황이 생기면 브라우저가 죽음
    const arr = [...take(size, { [Symbol.iterator]() { return iterator;}})];
    if (arr.length) yield arr;
    if (arr.length < size) break;

    yield 'remove me !!'; // 꿀팁: 여기서 무조건 잡아줄 것이므로 브라우저가 죽지 않음. 
  }
}

function* map<A>(f: (a: A) => B, iterable: Iterable<A>): IterableIterator<B>{
  for (const a of iterable){
    yield f(a);
  }
}

async function fromAsync(iterable: Iterable<Promise<T>>){
  const arr: Awaited<T>[] = [];
  for await (const a of iterable){
    arr.push(a);
  }
  return arr;
}

async function concurrent4(limit: number, fs: (() => Promise<T>)[]){
  // 제너레이터, 이터레이터 
  const result = 
    await fromAsync(
      map(ps => Promise.all(ps),
        map(fs => fs.map(f => f()), 
          chunk(limit, fs))));
    
  return result.flat();
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

  // 병렬적으로 실행
  const files = await Promise.all([
    getFile("file.png"),
    getFile("file1.png"),
    getFile("file2.png"),
    getFile("file3.png"),
  ]);

  // 부하를 줄이고 싶을 때 (한번에 다 요청하면 안될때)

  // 저 자리에서 이미 다 평가가 됨 -> await 으로 제어 못함
  const files = await concurrent(3, [
    getFile("file.png"),
    getFile("file1.png"),
    getFile("file2.png"),
    getFile("file3.png"),
  ]);

  // 지연 평가를 사용하면 된다.
  const files = await concurrent2(3, [
    () => getFile("file.png"),
    () => getFile("file1.png"),
    () => getFile("file2.png"),
    () => getFile("file3.png"),
  ]);

  const iterator = gen();
  iterator.next();

  console.log([...gen()]);

  const arr = [1, 2, 3, 4, 5];
  const iterator2 = arr[Symbol.iterator]();
  console.log(iterator2.next());

  const iterator = take(3, [1,2,3,4,5,6,7]);
  iterator.next();
  console.log(...take(4, [1,2,3,4,5]));

  const iterator = chunk(3, [1,2,3,4,5,6]);

  console.log(iterator.next().value);

  const files = await concurrent2(2, [
    () => getFile('file1.png'),
    () => getFile('file2.png'),
    () => getFile('file3.png'),
    () => getFile('file4.png'),
  ]);

  console.log(await files.next().value);
}
