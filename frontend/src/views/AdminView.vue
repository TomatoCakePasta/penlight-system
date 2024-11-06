<script setup>
import { nextTick, ref, onMounted, toRaw } from "vue"
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
const colorPanelTest = [
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

const colorPanel = ref();
const songList = ref();
const typeList = ref();

const editPanel = ref();

const c = ref();

// 洗濯中のパネルを判別
const selectedPanelId = ref(0);

const socket = props.socket;

const drawer = ref(false);
const isShowSongList = ref(true);

onMounted(() => {
  getAllPanels();
  getALlSongs();
  getAllTypes();
})

const onChangeLight = (idx, panel) => {
  // 新しい色をオーディエンスに送信
  socket.emit("changeColor", colorPanel.value[idx])

  // 新しく選択したパネルを囲む
  selectedPanelId.value = idx

  setSelectedPanel(panel);
}

// 現在選択中のパネル情報を取得
const setSelectedPanel = (panel) => {
  if (panel) {
    editPanel.value = panel;
  }

  // もしgradationの場合
  // 補助パレットを取得
}

const setPanelColor = (colorObj) => {
  const type = colorObj.type;
  let ret = "";

  // console.log("setPanelColor");
  // console.log(colorObj);

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
  axios.get("/panel")
  .then((res) => {
    // alert(res.data.panels.content[0].artist);
    // console.log(res.data.panels.content[0]);
    colorPanel.value = res.data.panels.content;

    if (editPanel) {
      editPanel.value = colorPanel.value[0];
    }

    changeTextToArray();
    // console.log(colorPanel.value);
  })
  .catch((err) => {
    alert("ERROR");
  });
}

const getALlSongs = () => {
  axios.get("/song-list")
  .then((res) => {
    songList.value = res.data.songs.content;
  })
  .catch((err) => {
    alert("ERROR");
  });
}

const getAllTypes = () => {
  axios.get("/type")
  .then((res) => {
    typeList.value = res.data.types.content;
    typeList.value = typeList.value.map(item => item.name);
    console.log(typeList);
  })
  .catch((err) => {
    alert("ERROR");
  });
}

// カンマ区切りのデータを配列に変換
const changeTextToArray = () => {
  // console.log("ChangeTextToArray");
  for (let i = 0; i < colorPanel.value.length; i++) {
    // カンマ区切りを配列に変換
    const arr = colorPanel.value[i].color.split(",");

    // 代入
    // console.log(arr);
    colorPanel.value[i].color = arr;
  }
}

const saveColorPanel = () => {
  axios.post("/save-panel", (req, res) => {
    // 再度DBを読み込み
    getAllPanels();
  })
  .then((err) => {
    alert("ERROR")
  });
}

</script>

<template>
  <v-card>
    <v-layout>
      <v-app-bar
        color="grey-darken-4"
        prominent
      >
        <v-app-bar-nav-icon variant="text" @click.stop="drawer=!drawer">
          
        </v-app-bar-nav-icon>
  
        <v-toolbar-title>DJ LIVE {{ (!isShowSongList && drawer) ? "- Edit Mode" : "" }}</v-toolbar-title>
  
        <v-spacer></v-spacer>
      </v-app-bar>
  
      <!-- permanentで展開時にmainコンテンツ -->
      <v-navigation-drawer
        v-model="drawer"
        permanent=""
        color="grey-darken-4"
      >
        <v-list>
          <v-list-item
            @click="isShowSongList = !isShowSongList"
            link
          >
            <v-list-item-content class="text-center">
              <p :class="isShowSongList ? '' : 'sub-info'">Set List</p>
              <p :class="isShowSongList ? 'sub-info' : ''">Color Picker</p>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <!-- セットリスト -->
        <div v-if="isShowSongList">
          <v-list>
            <v-list-item
              v-for="(song, index) in songList"
              :key="index"
              link
            >
              <v-list-item-content class="">
                <div class="ml-10">
                  <v-list-item-title class="pt-3 flex">
                    <p>
                      {{ index + 1 }}.&nbsp;
                    </p>
                    <p>
                      {{ song.title }}
                    </p>
                  </v-list-item-title>
                  <p class="sub-info">
                    {{ song.artist }}
                  </p>
                </div>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>

        <!-- TODO:パネルで選択中の情報をobjで保持 -->
        <div v-else>
          <div class="d-flex">
            <v-color-picker
              v-model="editPanel.color[0]"
              hide-inputs
              show-swatches
              width="230"
              class="mx-auto"
            ></v-color-picker>
          </div>

          <!-- <v-select
            label="Type"
            v-model="editPanel.type"
            :items="typeList"
            class="mt-5 ml-3 mr-3"
          >
          </v-select> -->

          <v-container fluid>
            <v-radio-group
              v-model="editPanel.type"
              class="ml-3 mr-3"
              inline
            >
              <v-radio
                v-for="(item, index) in typeList"
                :key="index"
                :label="item"
                :value="item"
                class="fixed-width-radio"
              >
              </v-radio>
            </v-radio-group>
          </v-container>

          <!-- グラデーション -->
          <v-col col="1" v-for="(item, index) in editPanel.color" :key="index">
            <v-card :style="{background: item}" link>&nbsp;</v-card>
          </v-col>
          <v-col col="1" v-if="(editPanel.type === 'gradation')">
            <v-card 
              link 
              class="text-center" 
              variant="outlined"
            >
              Add Color
            </v-card>
          </v-col>

          <v-text-field
            v-model="editPanel.message"
            label="Message"
            class="ml-3 mr-3"
          >
          </v-text-field>

          <v-text-field
            v-model="editPanel.subMessage"
            label="Sub Message"
            class="ml-3 mr-3"
          >
          </v-text-field>

          <v-text-field
            v-model="editPanel.label"
            label="Label"
            class="ml-3 mr-3"
          >
          </v-text-field>

          <v-row>
            <v-col                 
              class="ml-3 mr-3"
            >
              <div
                v-if="(editPanel.type === 'flash') || (editPanel.type === 'gradation')"
              >
                <p class="sub-info">Speed</p>
                <v-number-input
                  :reverse="false"
                  controlVariant="stacked"
                  :min="0"
                  :max="1000"
                  :hideInput="false"
                  :inset="false"
                  variant="filled"
                >
                </v-number-input>
              </div>

              <div
                v-if="editPanel.type === 'gradation'"
              >
                <p class="sub-info">Angle</p>
                <v-number-input
                  :reverse="false"
                  controlVariant="stacked"
                  :min="0"
                  :max="360"
                  :hideInput="false"
                  :inset="false"
                  variant="filled"
                >
                </v-number-input>
              </div>
            </v-col>
          </v-row>

          <div class="d-flex">
            <v-btn
              class="ml-auto mr-3 mb-3"
              variant="outlined"
            >
              SAVE
            </v-btn>
          </div>
        </div>
      </v-navigation-drawer>
      <v-main>
        <div class="home">
          <div class="title pt-5">
            <!-- <h1>ライブ名</h1> -->
          </div>
          <!-- リストでカラーパレット表示 -->
          <v-container>
            <v-row>
              <v-col 
                v-for="(panel, idx) in colorPanel" 
                :key="idx" 
                cols="6" 
                sm="4"
              >
                <div 
                  class="pa-2 panel"
                  :class="{
                    'selected': selectedPanelId === idx
                  }"
                >
                  <v-card
                    @click="onChangeLight(idx, panel)"
                    :style="{ background: setPanelColor(panel) }"
                    height="100"
                  >
                  <p 
                    class="label pa-5 py-10"
                    :style="(panel.type === 'home' || panel.color[0] === '#000000') ? { background: 'gray', color: 'white' } : {}"
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
      </v-main>
    </v-layout>
  </v-card>
</template>

<style scoped>
.home {
  height: 100vh;
  background-color: rgb(23, 23, 23);
}

.flex {
  display: flex;
}

.fixed-width-radio {
  min-width: 80px;
}

.sub-info {
  color: rgb(158, 158, 158);
  font-size: 15px;
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