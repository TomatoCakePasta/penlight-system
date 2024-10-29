<script setup>
import { ref } from "vue"

// const props = defineProps({
//     socket: Object
// });

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
    "label": ""
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
    "color": ["#3357FF", "#33FFF5"],
    "type": "gradation",
    "msg": "",
    "subMsg": ""
  }
]

// 洗濯中のパネルを判別
const selectedPanelId = ref(0);

// const socket = props.socket;

const onChangeLight = (idx) => {
  // 新しい色をオーディエンスに送信
  // socket.emit("changeColor", colorPanel[idx])

  // 新しく選択したパネルを囲む
  selectedPanelId.value = idx
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
        <v-col v-for="(panel, idx) in colorPanel" :key="idx" cols="6" sm="4">
          <div 
            class="pa-2 panel"
            :class="{
              'selected': selectedPanelId === idx
            }"
          >
            <v-card
              @click="onChangeLight(idx)"
              :style="{ background: panel.color }"
            >
             <p 
              class="label"
              :style="(panel.type === 'home' || panel.color[0] === 'black') ? { background: 'gray', color: 'white' } : {}"
              >
              {{ panel.label }} {{ panel.type }} 
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