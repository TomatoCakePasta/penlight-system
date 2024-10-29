<script setup>
import { onMounted, ref, toRaw } from "vue"

// const props = defineProps({
//     socket: Object
// });

const lightColor = ref("black")
const msg = ref("DJ LIVE 2/16");
const subMsg = ref("");
const title = "Coming soon ...";

// const socket = props.socket;
const isFlash = ref(false);

onMounted(() => {
});

// インターバルのIDを保持
let currentInterval;
let plainNewColor;

/*
socket.on("changeColor", (newColor) => {
  isFlash.value = false;

  // proxyから通常のオブジェクトに変換
  plainNewColor = toRaw(newColor);
  // 新しい色に更新
  lightColor.value = plainNewColor.color[0];
  msg.value = plainNewColor.msg;
  subMsg.value = plainNewColor.subMsg;

  // 各種モード
  switch(plainNewColor.type) {
    case "flash":
      flash(plainNewColor);
      break;

    case "gradation":
      gradation(plainNewColor);
      break;

    default:
      break;
  }
});
*/

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
  // CSSを書き換え
  // 色と速度 

  // css-selectorクラスをdivに追加
}

// TODO: もし色が複数色になった場合は関数化するとよきかも
const setColor = () => {

}
</script>

<template>
  <div class="home" :style="{backgroundColor: lightColor}">
    <div class="title pt-16">
      <h1>{{ msg }}</h1>
      <!-- <p>{{ subMsg }}</p> -->
    </div>
    <h1 v-if="msg" class="title loading">
      <!-- TODO: v-forで短く書きたい -->
      <span class="no1">C</span>
      <span class="no2">O</span>
      <span class="no3">M</span>
      <span class="no4">I</span>
      <span class="no5">N</span>
      <span class="no6">G</span>
      <span class="no7">&nbsp;</span>
      <span class="no8">S</span>
      <span class="no9">O</span>
      <span class="no10">O</span>
      <span class="no11">N</span>
      <span class="no12">.</span>
      <span class="no13">.</span>
      <span class="no14">.</span>
    </h1>
  </div>
</template>

<style scoped>
.home {
  height: 100vh;
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

@-webkit-keyframes AnimationName {
    0%{background-position:0% 14%}
    50%{background-position:100% 87%}
    100%{background-position:0% 14%}
}
@-moz-keyframes AnimationName {
    0%{background-position:0% 14%}
    50%{background-position:100% 87%}
    100%{background-position:0% 14%}
}
@keyframes AnimationName {
    0%{background-position:0% 14%}
    50%{background-position:100% 87%}
    100%{background-position:0% 14%}
}

/* ローディング */
.hide {
  display: none;
}

.loading {
  color: #000;
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
  background: #000;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  color: white;
  position: relative;
  top: 0;
}

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