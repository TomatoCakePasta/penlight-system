<script setup>
import { ref } from "vue"

const props = defineProps({
    socket: Object
});

const countClients = ref(0);

// カラーパネルの配列
// TODO: DBで動的にカラーパネルの追加修正を可能にする

/*
  type
  normal: 常時単色
  flash: 選択色が指定速度で点滅
  gradation: 選択色が指定速度でグラデーション
*/
const colorPanel = [
  {
    // 初期画面
    "color": ["black"],
    "type": "home",
    "msg": "DJ Live 2/17",
    "subMsg": "Coming soon ...",
    "label": "Home"
  },
  {
    "color": ["black"],
    "type": "",
    "msg": "",
    "subMsg": "",
    "label": "Wait"
  },
  {
    // フラッシュは点滅速度を設定
    "color": ["#33FFF5"],
    "type": "flash",
    "speed": 10,
    "msg": "",
    "subMsg": ""
  },
  {
    "color": ["#FF33A1"],
    "type": "flash",
    "speed": 60,
    "msg": "",
    "subMsg": ""
  },
  {
    "color": ["#fa143f", "#7b14fa", "#2d9ccb"],
    "type": "gradation",
    "speed": 13,
    "deg": 60,
    "msg": "",
    "subMsg": ""
  },
  {
    "color": ["#266400", "#d9da13", "#26b5c2"],
    "type": "gradation",
    "speed": 6,
    "deg": 60,
    "msg": "",
    "subMsg": ""
  }
]

// 洗濯中のパネルを判別
const selectedPanelId = ref(0);

const socket = props.socket;

const onChangeLight = (idx) => {
  // 新しい色をオーディエンスに送信
  socket.emit("changeColor", colorPanel[idx])

  // 新しく選択したパネルを囲む
  selectedPanelId.value = idx
}

const setPanelColor = (colorObj) => {
  const type = colorObj.type;
  let ret = "";

  switch(type) {
    case "normal":
      ret = colorObj.color;
      break;

    case "flash":
      ret = getFlashPanel(colorObj.color);
      break;

    case "gradation":
      ret = getGradationPanel(colorObj.color);
      break;

    default:
      break;
  }

  return ret;
}

const getFlashPanel = (color) => {
  return `repeating-linear-gradient(-45deg, #000000, #000000 5px, ${color} 5px, ${color} 10px)`;
}

const getGradationPanel = (colors) => {
  const gradientColors = colors.join(', '); // 配列をカンマで結合

  return `linear-gradient(270deg, ${gradientColors})`;
}

socket.on("enterClient", () => {
  countClients.value++;
});

socket.on("exitClients", () => {
  countClients.value--;
});

</script>

<template>
  <div class="home">
    <div class="title pt-5">
      <h1>ライブ名</h1>
      Audience : {{ countClients }}
    </div>
    <!-- リストでカラーパレット表示 -->
    <v-container>
      <v-row>
        <v-col v-for="(panel, idx) in colorPanel" :key="idx" cols="6" sm="4">
          <div 
            class="pa-2 panel"
            :class="{
              'selected': selectedPanelId === idx
            }"
          >
            <v-card
              @click="onChangeLight(idx)"
              :style="{ background: setPanelColor(panel) }"
            >
             <p 
              class="label"
              :style="(panel.type === 'home' || panel.color[0] === 'black') ? { background: 'gray', color: 'white' } : {}"
              >
              {{ panel.label }} &nbsp;
             </p>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.home {
  height: 100vh;
  background-color: black;
}

.panel {
  border-radius: 4px;
}

.selected {
  outline: solid;
  outline-color: aliceblue;
}

.title {
  color: white;
  text-align: center;
}

.label {
  text-align: center;
}

.dark-mode {
  color: aliceblue;
}

</style>