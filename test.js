async function a() {
  console.log("a function called");
}

async function b() {
    await setTimeout(() => {
        
    }, 1000);
  console.log("b function called");
}

async function c() {
    await setTimeout(() => {
        console.log("c function executed after 1 second");
    }, 5000);
    console.log("c function called");
}

a();
b();
c();
