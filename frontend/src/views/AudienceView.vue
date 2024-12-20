<script setup>
import { onMounted, ref, toRaw } from "vue"

const props = defineProps({
    socket: Object,
    url: String
});

const lightColor = ref("black")
const msg = ref("DJ LIVE 2/16");
const subMsg = ref("Coming soon ...");
const imageUrl = ref("");
const path = `${props.url}/images/`;
const imageName = ref("");

const socket = props.socket;
const isFlash = ref(false);

onMounted(() => {
});

// インターバルのIDを保持
let currentInterval;
let plainNewColor;

socket.on("changeColor", ([newColor, date]) => {
  isFlash.value = false;
  console.log("Change color");
  console.log(newColor);
  removeClass("instant-gradation");

  // proxyから通常のオブジェクトに変換
  plainNewColor = toRaw(newColor);
  // 新しい色に更新
  lightColor.value = plainNewColor.color[0];
  msg.value = plainNewColor.message;
  subMsg.value = plainNewColor.sub_message;
  imageUrl.value =  plainNewColor.image_name ? `${path}${plainNewColor.image_name}` : "";

  console.log("url",imageUrl.value);

  // 各種モード
  switch(plainNewColor.type) {
    case "flash":
      flash(plainNewColor);
      break;

    case "gradation":
      gradation(plainNewColor);
      break;

    case "normal":
      normal(plainNewColor);
      break;

    default:
      break;
  }
});

/**
 * 単色モード
 */
const normal = (newColor) => {

  const element = document.getElementById("back-monitor");

  // 前についているグラデーションの動的なクラスを削除
  element.classList.remove("instant-gradation");

  // 新しい<style>要素を作成
  const style = document.createElement('style');

  console.log("normal:", newColor.color[0]);

  // 擬似的にアニメーションを停止
  const speed = 100000;

  // 動的に生成するCSSを定義
  style.innerHTML = `
  .instant-gradation {
    background: 
      url('${imageUrl.value}');
    background-size: cover;
    background-position: center;
    -webkit-animation: AnimationName ${speed}s ease infinite;
    -moz-animation: AnimationName ${speed}s ease infinite;
    animation: AnimationName ${speed}s ease infinite;
  `;

  // <head>に<style>要素を追加
  document.head.appendChild(style);

  // クラスを付加
  element.classList.add("instant-gradation");

};

/**
 * 高速点滅モード
 * @param {object} newColor 新しい色や表示設定
 */
const flash = (newColor) => {
  // もし前シーンが別のストロボの場合
  if (currentInterval) {
    // 前シーンのストロボを停止
    clearInterval(currentInterval);
  }

  const flashColor = ["black", newColor.color[0]];
  let idx = 0;
  console.log("flash", flashColor);
  isFlash.value = true;
  const speed = newColor.speed;

  currentInterval = setInterval(() => {
    idx = (idx + 1) % 2;
    lightColor.value = flashColor[idx];

    // もしフラグがfalseになったら点滅を終了
    if (!isFlash.value) {
      clearInterval(currentInterval);
      // 新しい色を設定
      lightColor.value = plainNewColor.color[0];
    }
  }, speed); // 300ミリ秒ごとに切り替え
};

/**
 * グラデーションモード
 * @param {object} newColor 新しい色や表示設定
 */
const gradation = (newColor) => {
  const objColor = toRaw(newColor.color);
  const deg = newColor.deg;
  const speed = newColor.speed;
  const angle = newColor.angle;
  const colLen = objColor.length;

  let col = [];

  for (let i = 0; i < colLen; i++) {
    console.log(objColor[i]);
    col.push(objColor[i]);
  }

  console.log("gradation: ", deg, speed);
  console.log(col);

  // linear-gradientを作成
  const gradientColors = col.join(', '); // 配列をカンマで結合

  const element = document.getElementById("back-monitor");

  // 前についているグラデーションの動的なクラスを削除
  element.classList.remove("instant-gradation");

  // 新しい<style>要素を作成
  const style = document.createElement('style');

  // HACK: これだとstyleがどんどん追加されて無駄に蓄積
  // <style>タグ内のinstant-gradatioを毎回削除してから再度新しい内容で生成したい

  // const test_img = '../../public/imgs/artist.jpg';

  // console.log(imageUrl.value);

  // 動的に生成するCSSを定義
  style.innerHTML = `
  .instant-gradation {
    background: 
      linear-gradient(${angle}deg, ${gradientColors}),
      url('${imageUrl.value}');
    background-size: 600% 600%, cover; /* 画像はcover */
    background-position: 0% 50%, center; /* グラデーションはアニメーション, 画像は固定 */
    -webkit-animation: AnimationName ${speed}s ease infinite;
    -moz-animation: AnimationName ${speed}s ease infinite;
    animation: AnimationName ${speed}s ease infinite;
  }
  
  @keyframes AnimationName {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  `;

  // 動的に生成するCSSを定義
  // style.innerHTML = `
  // .instant-gradation {
  //   background: 
  //     linear-gradient(${angle}deg, ${gradientColors}),
  //     url('${imageUrl.value}');
  //   background-size: 600% 600%, cover; /* 画像はcover */
  //   background-position: 0% 50%, center; /* グラデーションはアニメーション, 画像は固定 */
  //   -webkit-animation: AnimationName ${speed}s ease infinite;
  //   -moz-animation: AnimationName ${speed}s ease infinite;
  //   animation: AnimationName ${speed}s ease infinite;
  // }
  
  // @keyframes AnimationName {
  //   0% { background-position: 0% 50%; }
  //   50% { background-position: 100% 50%; }
  //   100% { background-position: 0% 50%; }
  // }
  // `;

  // <head>に<style>要素を追加
  document.head.appendChild(style);

  // クラスを付加
  element.classList.add("instant-gradation");
}

const removeClass = (className) => {
  const element = document.getElementById("back-monitor");
  element.classList.remove(className);
}
// TODO: もし色が複数色になった場合は関数化するとよきかも
const setColor = () => {

}

let flag = true;
const onTestChange = () => {
  const element = document.getElementById("back-monitor");

  if (flag) {
    element.classList.remove("css-selector");
    element.classList.add("gradation-2");
  }
  else {
    element.classList.remove("gradation-2");
    element.classList.add("css-selector");
  }

  flag = !flag;
}

</script>

<template>
  <div
    id="back-monitor"
    class="home user-select-none bg_test"
    :style="{ 
      backgroundColor: lightColor,
      // backgroundImage: imageUrl ? `url('${imageUrl}')` : 'none',
      }"
  >
    <div class="title pt-16">
      <h1>{{ msg }}</h1>
      <!-- <img :src="imageUrl" alt="" style="object-fit: cover;"> -->
      <!-- <p>{{ subMsg }}</p> -->
    </div>
    <h1 v-if="subMsg" class="title loading">
      <!-- 別パネルのメッセージに切り替わる際に前のアニメーションをリセットするために要素を再作成する
       そのためにkeyを動的に変更することで再生成される
      -->
      <span v-for="(char, index) in subMsg.split('')" :key="subMsg + index" :class="'no' + (index + 1)">{{ char }}</span>
    </h1>
  </div>
</template>

<style scoped>
.home {
  height: 100vh;
}

.user-select-none {
  user-select: none;
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE11 */
}

.title {
  text-align: center;
  color: white;
}

/* グラデーション骨組み */
.css-selector {
  /* TODO: この背景色をJSでCSSを動的に変更したい */  
  background: linear-gradient(270deg, #fa143f, #7b14fa, #2d9ccb);
  background-size: 600% 600%;

  /* TODO: 速度も同様 */
  -webkit-animation: AnimationName 13s ease infinite;
  -moz-animation: AnimationName 13s ease infinite;
  animation: AnimationName 13s ease infinite;
}

.gradation-2 {
  /* TODO: この背景色をJSでCSSを動的に変更したい */  
  background: linear-gradient(270deg, #14fad0, #7b14fa, #cbcb2d);
  background-size: 600% 600%;

  /* TODO: 速度も同様 */
  -webkit-animation: AnimationName 13s ease infinite;
  -moz-animation: AnimationName 13s ease infinite;
  animation: AnimationName 13s ease infinite;
}

@-webkit-keyframes AnimationName {
    0%{background-position:30% 0%}
    50%{background-position:71% 100%}
    100%{background-position:30% 0%}
}
@-moz-keyframes AnimationName {
    0%{background-position:30% 0%}
    50%{background-position:71% 100%}
    100%{background-position:30% 0%}
}
@keyframes AnimationName {
    0%{background-position:30% 0%}
    50%{background-position:71% 100%}
    100%{background-position:30% 0%}
}

/* ローディング */
.hide {
  display: none;
}

.loading {
  color: #000000;
  font-size: 30px;
  font-weight: bold;
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  margin: auto;
  width: 300px;
  height: 50px;
  text-transform: uppercase;
  font-size: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading span {
  display: inline-block;
  background: #ffffff00;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  color: white;
  position: relative;
  top: 0;
}

/* 最大文字数決めて先にclass用意 */
.no1 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 0.1s;
}

.no2 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 0.2s;
}

.no3 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 0.3s;
}

.no4 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 0.4s;
}

.no5 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 0.5s;
}

.no6 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 0.6s;
}

.no7 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 0.7s;
}

.no8 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 0.8s;
}

.no9 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 0.9s;
}

.no10 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 1.0s;
}

.no11 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 1.1s;
}

.no12 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 1.2s;
}

.no13 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 1.3s;
}

.no14 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 1.4s;
}

.no15 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 1.5s;
}

.no16 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 1.6s;
}

.no17 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 1.7s;
}

.no18 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 1.8s;
}

.no19 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 1.9s;
}

.no20 {
  animation: foo 10s ease infinite, bar 5s linear infinite;
  animation-delay: 2.0s;
}

@keyframes foo {
  0% {
    top: 0;
  }
  5% {
    top: -10px;
  }
  10% {
    top: 0;
  }
  50% {
    top: 0;
  }
  100% {
    top: 0;
  }
}
@keyframes bar {
  10% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* レスポンシブ */
@media (min-width: 1024px) {
}
</style>