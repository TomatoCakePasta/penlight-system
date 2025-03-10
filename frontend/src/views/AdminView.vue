<script setup>
import { nextTick, ref, onMounted, toRaw } from "vue"
import axios from "axios";
import { useRouter } from "vue-router";
import draggableComponent from "vuedraggable";

const props = defineProps({
    socket: Object,
    url: String
});

const countClients = ref(0);

const router = useRouter();

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

const testLists = ref([
  {
    id: 1,
    content: "Test1",
  },
  {
    id: 2,
    content: "Test2",
  },
  {
    id: 3,
    content: "Test3",
  },
  {
    id: 4,
    content: "Test4",
  },
  {
    id: 5,
    content: "Test5",
  },
  {
    id: 6,
    content: "Test6",
  },
])

// vuedraggableのバージョンを確認してドキュメント通りにすれば動いた
// https://www.npmjs.com/package/vuedraggable/v/next

const colorPanel = ref();
const songList = ref();
const typeList = ref();

const panelType = ref([]);

const editPanel = ref();

const rules = {
  required: (value) => !value || "This field is required.",
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
const selectedEditSong = ref();
const selectedDelSongId = ref();
const newSong = ref({title: "", artist: ""});

const socket = props.socket;

/**
 * サイドパネル開閉フラグ
 */
const drawer = ref(false);

/**
 * セットリスト並べ替え
 */
const isSortSong = ref(false);

/**
 * 保存メッセージのスナックバー
 */
const snackBar = ref(false);

const isShowSongList = ref(true);
const isOpenDeleteDialog = ref(false);
const isOpenSongAddDialog = ref(false);
const isOpenSongEditDialog = ref(false);
const isOpenSongDelDialog = ref(false);

const isSongEditFormValid = ref(false);
const isSongAddFormValid = ref(false);

const isAgreeSongDel = ref(false);

onMounted(() => {
  getAllPanels();
  getAllSongs();
  getAllTypes();
})

const onLogout = () => {
  router.push({ name: "login" });
}

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
    selectedEditSong.value = song;
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

    // 各要素に画像形式データを保持するプロパティを用意
    setImageDataPorperty();

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

const setImageDataPorperty = () => {
  for (let i = 0; i < colorPanel.value.length; i++) {
    colorPanel.value[i].imageData = '';
  }
}

/**
 * パネルDB更新 colorPanelでパネル情報を送信
 */
const saveColorPanel = () => {
  let datas = colorPanel.value;

  let formData = new FormData();

  datas.forEach((data, index) => {
    console.log("before"+data.color);
    data.color = data.color.join(",");
    console.log("after"+data.color);
    data.sort_id = index + 1;
    data.image_name = data.imageData.name ? `${data.panel_id}_${data.imageData.name}` : data.image_name;

    if (data.imageData) {
      // data.picはFileオブジェクト
      // nameでファイル名を取得
      formData.append("image", data.imageData, encodeURIComponent(`${data.panel_id}_${data.imageData.name}`));
    }
  })

  formData.append("data", JSON.stringify(datas));

  axios.post("/save-panel", formData)
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
    panel_id: colorPanel.value[selectedPanelId.value].panel_id,
    image_name: colorPanel.value[selectedPanelId.value].image_name
  }

  isOpenDeleteDialog.value = false;

  axios.post("/del-panel", data)
    .then((res) => {
      getAllPanels();
      let changeId = selectedPanelId.value;
      selectedPanelId.value = changeId - 1 >= 0 ? changeId - 1 : 0;
    })
    .catch((err) => {

    })
}

/**
 * 画像を削除
 */
const delImage = () => {

  const data = {
    panel_id: colorPanel.value[selectedPanelId.value].panel_id,
    image_name: colorPanel.value[selectedPanelId.value].image_name
  }
  
  axios.post("/del-image", data)
    .then((res) => {
      // フォームをクリア
      colorPanel.value[selectedPanelId.value].image_name = "";
      colorPanel.value[selectedPanelId.value].imageData = null;
    })
    .catch((err) => {

    })
}

/**
 * セットリスト更新
 */
const saveSong = () => {
  const updateSong = selectedEditSong.value;
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
 * 並び順更新
 */
const saveSongSort = () => {
  let datas = songList.value;

  datas.forEach((data, index) => {
    data.sort_id = index + 1;
  });

  axios.post("/save-song-sort", datas)
    .then((res) => {
        // 再度DBを読み込み
        getAllSongs();
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
      isOpenSongAddDialog.value = false;
      newSong.title = "";
      newSong.artist = "";
    })
    .catch((err) => {

    })
}

/**
 * セットリスト削除
 */
const delSong = () => {
  let image_names = [];

  colorPanel.value.forEach((panel, index) => {
    if (panel.image_name !== "") {
      image_names.push(panel.image_name);
    }
  })

  console.log("images", image_names);

  // TODO: 画像だけの配列を入れる
  // server側でforぶん回してfsで削除
  const data = {
    song_id: selectedDelSongId.value,
    image_names: image_names
  }

  console.log(data);

  axios.post("/del-song", data)
    .then((res) => {
      getAllSongs();
      selectedDelSongId.value = "";
      isOpenSongDelDialog.value = false; 
      isAgreeSongDel.value = false;
    })
    .catch((err) => {

    })
}

/**
 * セットリスト並び更新
 */
const onSortSong = () => {
  // ソートを保存
  if (isSortSong.value) {
    saveSongSort();

    isSortSong.value = false;
  }
  // ソートモードに変更
  else {
    isSortSong.value = true;
  }
}

const isShowDebug = ref(false);
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
        <v-btn class="mx-3" @click="onLogout">Exit</v-btn>
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
            <draggable-component 
              v-model="songList" 
              item-key="id" 
              handle=".handle"
            >
              <template #item="{element, index}">
                <v-list-item
                  :key="element.song_id"
                  link
                  @click="onChangeSong(element)"
                >
                  <v-list-item-content :class="isSortSong ? 'handle' : ''">
                    <div class="ml-10">
                      <v-list-item-title class="pt-3 flex">
                        <p>
                          {{ index + 1 }}.&nbsp;
                        </p>
                        <p>
                          {{ element.title }}
                        </p>
                      </v-list-item-title>
                      <p class="sub-info">
                        {{ element.artist }}
                      </p>
                    </div>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </draggable-component>

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
                  label="Title"
                  v-model="selectedEditSong.title"
                  maxlength="20"
                  :rules="[rules.required]"
                >
                </v-text-field>
                <v-text-field
                  label="Artist"
                  v-model="selectedEditSong.artist"
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
              v-model="isOpenSongAddDialog"
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
                    label="Title"
                    v-model="newSong.title"
                    maxlength="20"
                    :rules="[rules.required]"
                  >
                  </v-text-field>
                  <v-text-field
                    label="Artist"
                    v-model="newSong.artist"
                    maxlength="20"
                    :rules="[rules.required]"
                  >
                  </v-text-field>
                  <v-card-actions>
                    <v-btn class="ms-auto" @click="isOpenSongAddDialog = false">
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

            <!-- セットリスト削除 -->
            <v-dialog
              v-model="isOpenSongDelDialog"
              class="text-center"
            >
              <v-card
                title="Delete Song"
                max-width="200"
                variant="flat"
                color="grey-darken-4"
              >
                <v-form v-model="isSongAddFormValid">
                  <v-select
                    :items="songList"
                    label="Select Song"
                    v-model="selectedDelSongId"
                    item-value="song_id"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" :subtitle="item.raw.artist"></v-list-item>
                    </template>
                  </v-select>
                  <!-- 同意のチェックボタン -->
                  <v-checkbox v-model="isAgreeSongDel" label="Are you sure?"></v-checkbox>
                  
                  <v-card-actions>
                    <v-btn class="ms-auto" @click="isOpenSongDelDialog = false; isAgreeSongDel = false">
                      CANCEL
                    </v-btn>
                    <v-btn
                      class="ms-auto"
                      :disabled="!isAgreeSongDel"
                      @click="delSong"
                    >
                    DELETE
                    </v-btn>
                  </v-card-actions>
                </v-form>
              </v-card>
            </v-dialog>

            <!-- セットリスト追加 見栄えのため透明なボタンにする-->
            <v-list-item
              link
              class="song-list"
              @click="isOpenSongAddDialog = true"
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

            <!-- セットリスト削除 -->
            <v-list-item
              link
              class="song-list"
              @click="isOpenSongDelDialog = true"
            >
              <v-list-item-content>
                <div class="ml-10 sub-info">
                  <v-list-item-title class="pt-3 flex">
                    <p class="pop-msg pb-4">
                      Delete Song
                    </p>
                  </v-list-item-title>
                </div>
              </v-list-item-content>
            </v-list-item>

            <!-- セットリスト並べ替え -->
            <v-list-item
              link
              class="song-list"
              @click="onSortSong"
            >
              <v-list-item-content>
                <div class="ml-10 sub-info">
                  <v-list-item-title class="pt-3 flex">
                    <p class="pop-msg pb-4">
                      {{ isSortSong ? "Save Song" : "Sort Song" }}
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
            v-model="colorPanel[selectedPanelId].sub_message"
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

          <v-file-input 
            label="Image input" 
            prepend-icon="" 
            class="ml-3 mr-3"
            v-model="colorPanel[selectedPanelId].imageData"
            v-if="!colorPanel[selectedPanelId].image_name"
          ></v-file-input>

          <v-col col="1">
            <div class="flex mb-3" v-if="colorPanel[selectedPanelId].image_name">
              <v-card class="flex-grow-1 flex pic-form">
                <p class="ml-auto mr-auto sub-info">
                  Selected [ {{ colorPanel[selectedPanelId].image_name }} ]
                </p>
              </v-card>
              <v-btn 
                variant="text" 
                class="ml-2" 
                height="30" 
                width="30" 
                icon="mdi-window-close"
                @click="delImage"
              ></v-btn>
            </div>
          </v-col>

          <v-row>
            <v-col                 
              class="ml-3 mr-3"
            >
              <!-- TODO: idではなくtype名を指定したい gradation 現状はselectで1つしかv-modelでbindできないため -->
              <div
                v-if="(colorPanel[selectedPanelId].type_id === 3) || (colorPanel[selectedPanelId].type_id === 4)"
                class="mb-5"
              >
                <p class="sub-info">Delay {{ colorPanel[selectedPanelId].speed }}</p>
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
                variant="flat"
                color="grey-darken-4"
                text="Are you sure?"
              >
                <v-card-actions>
                  <v-btn
                    @click="isOpenDeleteDialog = false"
                    class="mr-10"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    class="ms-auto ml-10"
                    @click="delPanel"
                  >
                    Delete
                  </v-btn>
                </v-card-actions>
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

            <draggable-component v-model="colorPanel" item-key="panel_id" handle=".handle" tag="v-row">
              <template #item="{element, index}">
                <v-col 
                  :key="element.panel_id" 
                  cols="6" 
                  sm="4"
                >
                  <div 
                    class="pa-2 panel"
                    :class="{
                      'selected': selectedPanelId === index
                    }"
                  >
                    <v-card
                      @click="onChangeLight(index, element)"
                      :style="{background: setPanelColor(element)}"
                      height="100"
                      :class="drawer ? 'handle' : ''"
                      class="flex"
                    >
                      <!-- <p 
                        class="label pa-5 py-10"
                        :style="(element.type === 'home' || element.color[0] === '#000000') ? { background: 'gray', color: 'white' } : {}"
                        > -->
                      <p class="label-color ma-auto pa-1 px-2" v-if="element.label">
                        {{ element.label }}
                      </p>
                    </v-card>
                  </div>
                </v-col>     
              </template>    
            </draggable-component>

            <!-- <v-row v-if="false">
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
                    :style="{background: setPanelColor(panel)}"
                    height="100"
                  >
                    <p 
                      class="label pa-5 py-10"
                      :style="(panel.type === 'home' || panel.color[0] === '#000000') ? { background: 'gray', color: 'white' } : {}"
                      >
                      {{ panel.label }}&nbsp;
                    </p>
                  </v-card>
                </div>
              </v-col>         
            </v-row> -->

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

          <draggable-component v-model="testLists" item-key="id" handle=".handle" tag="v-row" v-if="false">
              <template #item="{element, index}">
                <v-col :key="element.id" cols="6" sm="4"> 
                  <div>
                    <v-card class="sub-info handle">
                      <span class="sub-info">ここを押せば動かせます。</span>
                      <p>
                        {{ element }} {{ index }}
                      </p>
                    </v-card>
                  </div>
                </v-col>
              </template>
          </draggable-component>
          <!-- <draggable-component v-model="testLists" group="people" item-key="id" handle=".handle">
            <template #item="{element}">
              <v-card class="drag-item sub-info handle">
                <span class="sub-info">ここを押せば動かせます。</span>
                {{ element.id }}
              </v-card>
            </template>
          </draggable-component> -->
          <p class="sub-info" v-if="false">
            {{ testLists }}
          </p>
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

.label-color {
  align-self: flex-start;
  background-color: rgb(23, 23, 23);
  color: aliceblue;
  border-radius: 10%;
}

.pic-form {
  background-color: rgba(0, 0, 0, 0);
}
</style>