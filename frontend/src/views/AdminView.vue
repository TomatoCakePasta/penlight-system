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

const panelType = ref([]);

const editPanel = ref();

const rules = {
  required: (value) => !!value || "This field is required.",
}

// 選択中のパネルを判別
/**
 * 選択中のパネルを判別
 */
const selectedPanelId = ref(0);

/**
 * 選択中のパネル内にある複数色の色のうち変更したい色 
 */ 
const selectedColorInPanelId = ref(0);

/**
 * 選択中のセットリスト
 */
const selectedSongId = ref(1);
const selectedSong = ref();
const newSong = ref({title: "", artist: ""});

// TODO: 選択中の曲のパネルを全て保持する用のオブジェクト用意する?
// 上記2つから一意にパネル特定できない?[selectedPanelId][selectedSongId]みたいに

const socket = props.socket;

/**
 * サイドパネル開閉フラグ
 */
const drawer = ref(false);

/**
 * 保存メッセージのスナックバー
 */
const snackBar = ref(false);

const isShowSongList = ref(true);
const isOpenDeleteDialog = ref(false);
const isOpenAddSongDialog = ref(false);
const isOpenSongEditDialog = ref(false);

const isSongEditFormValid = ref(false);
const isSongAddFormValid = ref(false);

onMounted(() => {
  getAllPanels();
  getAllSongs();
  getAllTypes();
})

/**
 * 
 * @param idx 
 * @param panel 
 * オペレーションモードの時,選択したパネルカラーをクライアントに送信
 */
const onChangeLight = (idx, panel) => {
  // TODO: セットリスト表示の時も変更可能の方がいいかも
  if (!drawer.value) {
    // 新しい色をオーディエンスに送信
    socket.emit("changeColor", colorPanel.value[idx])
  
    setSelectedPanel(panel);
  }

  // 新しく選択したパネルを囲む
  selectedPanelId.value = idx
}

const onChangeSong = (song) => {
  // すでに選択済みなら編集モード
  if (selectedSongId.value === song.song_id) {
    isOpenSongEditDialog.value = true;
    selectedSong.value = song;
  }
  else {
    selectedSongId.value = song.song_id;
  
    // その曲のパネルを取得
    getAllPanels();
  }
}

// 現在選択中のパネル情報を取得
/**
 * 
 * @param panel 
 * 選択中のパネル情報を取得 editPanelに代入
 */
const setSelectedPanel = (panel) => {
  if (panel) {
    editPanel.value = panel;
  }

  // もしgradationの場合
  // 補助パレットを取得
}

/**
 * 
 * @param colorObj 
 * 引数のtype別にcss文を返却
 */
const setPanelColor = (colorObj) => {
  const type = typeList.value[colorObj.type_id - 2];
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
      console.log(ret);
      break;

    default:
      break;
  }

  // panelType.value[idx] = ret;
  return ret;
}

const getFlashPanel = (color) => {
  return `repeating-linear-gradient(-45deg, #000000, #000000 5px, ${color[0]} 5px, ${color[0]} 10px)`;
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
  axios.get(`/panel/${selectedSongId.value}`)
  .then((res) => {
    // alert(res.data.panels.content[0].artist);
    // console.log(res.data.panels.content[0]);
    colorPanel.value = res.data.panels.content;

    if (editPanel) {
      editPanel.value = colorPanel.value[0];
    }

    changeTextToArray();
    console.log(colorPanel.value);

    // colorPanel.value.map((colorObj, idx) => setPanelColor(colorObj, idx));
    console.log("panelType");
    console.log(panelType.value);
  })
  .catch((err) => {
    alert("ERROR GET ALL PANEL", err);
  });
}

// セットリストを取得
const getAllSongs = () => {
  axios.get("/song-list")
  .then((res) => {
    songList.value = res.data.songs.content;
  })
  .catch((err) => {
    alert("ERROR");
  });
}

// パネルタイプの種類を取得
const getAllTypes = () => {
  axios.get("/type")
  .then((res) => {
    typeList.value = res.data.types.content;
    // homeタイプは除く
    typeList.value = typeList.value.slice(1).map(item => item.name);
    // console.log(typeList);
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

/**
 * パネルDB更新 colorPanelでパネル情報を送信
 */
const saveColorPanel = () => {
  /*
  const newData = editPanel.value;
  console.log(newData);

  const data = {
    panel_id: newData.panel_id,
    sort_id: newData.sort_id,
    color: newData.color.join(","),
    message: newData.message,
    sub_message: newData.sub_message,
    speed: newData.speed,
    angle: newData.angle,
    label: newData.label,
    type_id: newData.type_id    
  }
    */

  let datas = colorPanel.value;

  datas.forEach((data) => {
    console.log("before"+data.color);
    data.color = data.color.join(",");
    console.log("after"+data.color);
  })

  axios.post("/save-panel", datas)
    .then((res) => {
      // 再度DBを読み込み
      getAllPanels();

      // 保存メッセージのスナックバー
      snackBar.value = true;
    })
    .catch((err) => {

    });
}

/**
 * グラデーションカラーパネルを追加
 */
const addGradationPanel = () => {
  const initColor = "#ffffff"

  // color配列を追加
  colorPanel.value[selectedPanelId.value].color.push(initColor);
}

/**
 * グラデーションカラーパネルを削除
 */
const delGradationPanel = (idx) => {
  colorPanel.value[selectedPanelId.value].color.splice(idx, 1);
}

/**
 * 新規パネル追加
 */
const addPanel = () => {
  const data = {
    song_id: selectedSongId.value
  }

  axios.post("/add-panel", data)
    .then((res) => {
      getAllPanels();
    })
    .catch((err) => {

    })
}

const delPanel = () => {
  const data = {
    panel_id: colorPanel.value[selectedPanelId.value].panel_id
  }

  isOpenDeleteDialog.value = false;

  axios.post("/del-panel", data)
    .then((res) => {
      getAllPanels();
    })
    .catch((err) => {

    })
}

/**
 * セットリスト更新
 */
const saveSong = () => {
  const updateSong = selectedSong.value;
  const data = {
    song_id: updateSong.song_id,
    title: updateSong.title,
    artist: updateSong.artist,
    sort_id: updateSong.sort_id
  }

  axios.post("/save-song", data)
    .then((res) => {
      // 再度DBを読み込み
      getAllSongs();

      isOpenSongEditDialog.value = false;
    })
    .catch((err) => {

    });
}

/**
 * セットリスト追加
 */
const addSong = () => {
  const data = {
    title: newSong.value.title,
    artist: newSong.value.artist
  }

  axios.post("/add-song", data)
    .then((res) => {
      getAllSongs();
      isOpenAddSongDialog.value = false;
      newSong.title = "";
      newSong.artist = "";
    })
    .catch((err) => {

    })
}

const isShowDebug = ref(true);
</script>

<template>
  <!-- サイドバー開閉時に下地が映るため黒を設定 -->
  <v-card
    class="base-back user-select-none"
  >
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
              @click="onChangeSong(song)"
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
                    <!-- <v-text-field v-model="song.title"></v-text-field> -->
                  </v-list-item-title>
                  <p class="sub-info">
                    {{ song.artist }}
                  </p>
                  <!-- <v-text-field v-model="song.artist"></v-text-field> -->
                </div>
              </v-list-item-content>
            </v-list-item>

            <!-- セットリスト修正 -->
            <v-dialog
              v-model="isOpenSongEditDialog"
              class="text-center"
            >
              <v-card
                title="Song Edit"
                max-width="200"
                color="grey-darken-4"
              >
              <v-form v-model="isSongEditFormValid">
                <v-text-field 
                  label="Song title"
                  v-model="selectedSong.title"
                  maxlength="20"
                  :rules="[rules.required]"
                >
                </v-text-field>
                <v-text-field
                  label="Song artist"
                  v-model="selectedSong.artist"
                  maxlength="20"
                  :rules="[rules.required]"
                >
                </v-text-field>
                <v-card-actions>
                  <v-btn class="ms-auto" @click="isOpenSongEditDialog = false">
                    CLOSE
                  </v-btn>
                  <v-btn
                    class="ms-auto"
                    :disabled="!isSongEditFormValid"
                    @click="saveSong"
                  >
                  SAVE
                  </v-btn>
                </v-card-actions>
              </v-form>
              </v-card>
            </v-dialog>

            <!-- セットリスト追加 -->
            <v-dialog
              v-model="isOpenAddSongDialog"
              class="text-center"
            >
              <v-card
                title="Add Song"
                max-width="200"
                variant="flat"
                color="grey-darken-4"
              >
                <v-form v-model="isSongAddFormValid">
                  <v-text-field 
                    label="Song title"
                    v-model="newSong.title"
                    maxlength="20"
                    :rules="[rules.required]"
                  >
                  </v-text-field>
                  <v-text-field
                    label="Song artist"
                    v-model="newSong.artist"
                    maxlength="20"
                    :rules="[rules.required]"
                  >
                  </v-text-field>
                  <v-card-actions>
                    <v-btn class="ms-auto" @click="isOpenAddSongDialog = false">
                      CLOSE
                    </v-btn>
                    <v-btn
                      class="ms-auto"
                      :disabled="!isSongAddFormValid"
                      @click="addSong"
                    >
                    SAVE
                    </v-btn>
                  </v-card-actions>
                </v-form>
              </v-card>
            </v-dialog>

            <!-- セットリスト追加 見栄えのため透明なボタンにする-->
            <v-list-item
              link
              class="song-list"
              @click="isOpenAddSongDialog = true"
            >
              <v-list-item-content>
                <div class="ml-10 sub-info">
                  <v-list-item-title class="pt-3 flex">
                    <p class="pop-msg pb-4">
                      Add Song
                    </p>
                  </v-list-item-title>
                </div>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>

        <!-- TODO:パネルで選択中の情報をobjで保持 -->
        <div v-else>
          <div class="d-flex">
            <v-color-picker
              v-model="colorPanel[selectedPanelId].color[selectedColorInPanelId]"
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
              v-model="colorPanel[selectedPanelId].type_id"
              class="ml-3 mr-3"
              inline
            >
              <v-radio
                v-for="(item, index) in typeList"
                :key="index"
                :label="item"
                :value="index + 2"
                class="fixed-width-radio"
              >
              </v-radio>
            </v-radio-group>
          </v-container>

          <!-- グラデーション -->
          <v-col col="1" v-if="(typeList && typeList[colorPanel[selectedPanelId].type_id - 2] === 'gradation')">
            <!-- TODO: すでにカラーパネルが7枚ならdisabledにしたい -->
            <v-card 
              link 
              class="text-center" 
              variant="outlined"
              @click="addGradationPanel"
            >
              Add Color
            </v-card>
          </v-col>
          <v-col col="1" v-for="(item, index) in colorPanel[selectedPanelId].color" :key="index">
            <div class="flex" v-if="(colorPanel[selectedPanelId].type_id === 4) || (index === 0)">
              <v-card class="flex-grow-1" :style="{background: item}" link @click="selectedColorInPanelId = index">
                &nbsp;
              </v-card>
              <v-btn 
                variant="text" 
                :disabled="index === 0" 
                class="ml-2" 
                height="30" 
                width="30" 
                icon="mdi-window-close"
                @click="delGradationPanel(index)"
              ></v-btn>
            </div>
          </v-col>

          <v-text-field
            v-model="colorPanel[selectedPanelId].message"
            label="Message"
            class="ml-3 mr-3"
          >
          </v-text-field>

          <v-text-field
            v-model="colorPanel[selectedPanelId].sub_essage"
            label="Sub Message"
            class="ml-3 mr-3"
          >
          </v-text-field>

          <v-text-field
            v-model="colorPanel[selectedPanelId].label"
            label="Label"
            class="ml-3 mr-3"
          >
          </v-text-field>

          <v-row>
            <v-col                 
              class="ml-3 mr-3"
            >
              <!-- TODO: idではなくtype名を指定したい gradation 現状はselectで1つしかv-modelでbindできないため -->
              <div
                v-if="(colorPanel[selectedPanelId].type_id === 3) || (colorPanel[selectedPanelId].type_id === 4)"
                class="mb-5"
              >
                <p class="sub-info">Speed {{ colorPanel[selectedPanelId].speed }}</p>
                <!-- <v-number-input
                  :reverse="false"
                  controlVariant="stacked"
                  :min="0"
                  :max="1000"
                  :hideInput="false"
                  :inset="false"
                  variant="filled"
                  v-model="colorPanel[selectedPanelId].speed">
                </v-number-input> -->
                <v-slider
                  v-model="colorPanel[selectedPanelId].speed"
                  max="200"
                  min="10"
                  class="align-center"
                  hide-details
                  step="10"
                  thumb-label=""
                >
                </v-slider>
              </div>

              <!-- TODO: idではなくtype名を指定したい gradation 現状はselectで1つしかv-modelでbindできないため -->
              <div
                v-if="colorPanel[selectedPanelId].type_id === 4"
                class="mb-5"
              >
                <p class="sub-info">Angle  {{ colorPanel[selectedPanelId].angle }}</p>
                <!-- <v-number-input
                  :reverse="false"
                  controlVariant="stacked"
                  :min="0"
                  :max="360"
                  :hideInput="false"
                  :inset="false"
                  variant="filled"
                  v-model="colorPanel[selectedPanelId].angle"
                >
                </v-number-input> -->
                <v-slider
                  v-model="colorPanel[selectedPanelId].angle"
                  max="360"
                  min="0"
                  class="align-center"
                  hide-details
                  step="10"
                  thumb-label=""
                >
                </v-slider>
              </div>
            </v-col>
          </v-row>

          <div class="d-flex">
            <!-- <v-btn
              class="ml-auto mr-3 mb-3"
              variant="outlined"
              @click="saveColorPanel"
            >
              SAVE
            </v-btn> -->

            <!-- TODO: 確認ダイアログ出す Are you sure? IDでパネル削除する削除APIを呼ぶ-->
            <v-btn 
              color="amber-darken-3" 
              variant="outlined" 
              class="ml-3"
              @click="isOpenDeleteDialog = true"
            >
              DELETE
            </v-btn>
            <v-dialog
              v-model="isOpenDeleteDialog"
              width="auto"
            >
              <v-card
                
                text="Are you sure?"
              >
                <template v-slot:actions>
                  <v-btn
                    @click="isOpenDeleteDialog = false"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    class="ms-auto"
                    @click="delPanel"
                  >
                  OK
                  </v-btn>
                </template>
              </v-card>
            </v-dialog>



            <v-snackbar
              :timeout="1500"
              color="teal-accent-4"
              elevation="24"
              location="bottom"
              class="mb-5 snackbar-back"
              variant="outlined"
              min-width="300">
              <template v-slot:activator="{ props }">
                <v-btn 
                  class="ml-auto mr-3 mb-5" 
                  variant="outlined"
                  v-bind="props"
                  @click="saveColorPanel"
                >
                  SAVE
                </v-btn>
              </template>
  
              <p class="text-center">
                Saved Data.
              </p>
            </v-snackbar>
          </div>
        </div>
      </v-navigation-drawer>

      <v-main>
        <p class="sub-info" v-if="isShowDebug">
          select {{ selectedPanelId }}
          song {{ selectedSongId }} 
          {{ isOpenSongEditDialog }}
          {{ songList }}
        </p>
        <div class="home">
          <div class="title pt-5">
            <!-- <h1>ライブ名</h1> -->
          </div>
          <!-- リストでカラーパレット表示 -->
          <v-container>
            <v-row>
              <!-- TODO: sm=2,3が良きかも -->
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
                  <!-- <v-card
                    @click="onChangeLight(idx, panel)"
                    :style="{ background: setPanelColor(panel) }"
                    height="100"
                  > -->
                  <v-card
                    @click="onChangeLight(idx, panel)"
                    :style="{background: setPanelColor(panel)}"
                    height="100"
                  >
                    <p 
                      class="label pa-5 py-10"
                      :style="(panel.type === 'home' || panel.color[0] === '#000000') ? { background: 'gray', color: 'white' } : {}"
                      >
                      {{ panel.label }}&nbsp;
                      <!-- {{ panel.color }} -->
                    </p>
                  </v-card>
                </div>
              </v-col>         
            </v-row>

            <div class="mt-5 ml-2">
              <v-btn 
                @click="getClients"
                class=""
                color="white"
                variant="outlined"
              >
                <p class="">
                  Audience : {{ countClients }}
                </p>
              </v-btn>
  
              <v-btn 
                class="ml-5" 
                v-if="drawer"
                color="white"
                variant="outlined"
                @click="addPanel"
              >
                Add Panel
              </v-btn>
  
              <v-btn @click="getAllPanels" v-if="isShowDebug">GET</v-btn>
            </div>


            <p class="sub-info" v-if="isShowDebug">
              {{ colorPanel }}
              {{ typeList }}
            </p>
          </v-container>
        </div>
        <!-- フッター -->
        <p class="sub-info text-center">&copy; 2024 ShibaLab</p>
      </v-main>
    </v-layout>
  </v-card>
</template>

<style scoped>
.home {
  height: 100vh;
  overflow: auto;
  background-color: rgb(23, 23, 23);
}

.user-select-none {
  user-select: none;
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE11 */
}

.base-back {
  background-color: rgb(23, 23, 23);
}

.snackbar-back {
  /* background-color: rgb(0, 0, 0); */
  /* outline: 1rem solid; */
  /* border: 2px solid teal; */
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

.pop-msg {
  opacity: 0;
  transition: all 0.3s ease;
}

.song-list:hover .pop-msg {
  color: white;
  opacity: 1;
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