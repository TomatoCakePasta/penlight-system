<script setup>
import { nextTick, ref, onMounted } from "vue"
import axios from "axios";

const props = defineProps({
    socket: Object,
    url: String
});

const countClients = ref(0);

// baseURLを設定
axios.defaults.baseURL = props.url;

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
    "type": "normal",
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

const colorPanelTest = ref();

// 洗濯中のパネルを判別
const selectedPanelId = ref(0);

const socket = props.socket;

onMounted(() => {
  getAllPanels();
})

const onChangeLight = (idx) => {
  // 新しい色をオーディエンスに送信
  socket.emit("changeColor", colorPanel[idx])

  // 新しく選択したパネルを囲む
  selectedPanelId.value = idx
}

const setPanelColor = (colorObj) => {
  const type = colorObj.name;
  let ret = "";

  console.log("setPanelColor");
  console.log(colorObj);

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

socket.on("enterClient", (count) => {
  addClients(count);
});

socket.on("exitClients", (count) => {
  delClients(count);
});

const addClients = (count) => {
  countClients.value = count;
  nextTick(() => {
    console.log(`enter user ${countClients.value}`);
  });
};

const delClients = (count) => {
  countClients.value = count;
  nextTick(() => {
    console.log(`exit user ${countClients.value}`);
  });
};

const getClients = () => {
  console.log("send getClients event");
  socket.emit("getClients");
}

socket.on("getClients", (count) => {
  countClients.value = count;
  console.log(`now users ${countClients.value}`);
});

// dbから色を取得
const getAllPanels = () => {
  axios.get("/song-list")
  .then((res) => {
    // alert(res.data.panels.content[0].artist);
    // console.log(res.data.panels.content[0]);
    colorPanelTest.value = res.data.panels.content;
    changeTextToArray();
    console.log(colorPanelTest.value);
  })
  .catch((err) => {
    alert("ERROR");
  });
}

// カンマ区切りのデータを配列に変換
const changeTextToArray = () => {
  console.log("ChangeTextToArray");
  for (let i = 0; i < colorPanelTest.value.length; i++) {
    // カンマ区切りを配列に変換
    const arr = colorPanelTest.value[i].color.split(",");

    // 代入
    console.log(arr);
    colorPanelTest.value[i].color = arr;
  }
}

</script>

<template>
  <div class="home">
    <div class="title pt-5">
      <h1>ライブ名</h1>
    </div>
    <!-- リストでカラーパレット表示 -->
    <v-container>
      <v-row>
        <v-col v-for="(panel, idx) in colorPanelTest" :key="idx" cols="6" sm="4">
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
              class="label pa-5 py-10"
              :style="(panel.type === 'home' || panel.color[0] === 'black') ? { background: 'gray', color: 'white' } : {}"
              >
              {{ panel.label }} &nbsp;
             </p>
            </v-card>
          </div>
        </v-col>
        <v-btn 
          @click="getClients"
          class="ml-5"
        >
        <p class="">
          Audience : {{ countClients }}
        </p>
        </v-btn>
        <v-btn @click="getAllPanels">GET</v-btn>
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