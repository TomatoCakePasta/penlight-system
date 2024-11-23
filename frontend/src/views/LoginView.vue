<script setup>
import { onMounted, ref, toRaw } from "vue"
import axios from "axios";
import { useRouter } from "vue-router";

const props = defineProps({
    url: String
});

// baseURLを設定
axios.defaults.baseURL = props.url;

const router = useRouter();

const visible = ref(false);

const name = ref("");
const rawPass = ref("");

const onLogin = () => {
  const data = {
    name: name.value,
    rawPass: rawPass.value
  }
  
  axios.post("/login", data)
    .then((res) => {
      if (res.data.flag) {
        clearForm();
        // ログイン完了
        router.push({ name: "admin" });
      }
      else {
        alert("パスワードを再度入力してください");
      }
    })
    .catch((err) => {
      alert(err);
    });
    
  //  axios.post("/signup", data);
}

const clearForm = () => {
  name.value = "";
  rawPass.value = "";
}

</script>

<template>
  <div class="home">
    <div class="d-flex center">
      <img src="../assets/dj.png" alt="" width="100" class="ma-5">
      <h1 class="white mt-10">Login</h1>
    </div>

    <div class="flex center">
      <v-card
        class="pa-12 pb-8 ma-5 card-size"
        elevation="8"
        max-width="448"
        rounded="lg"
        color="white"
        variant="outlined"
      >
        <div class="text-subtitle-1 text-medium-emphasis">
          <p class="white">Account</p>
        </div>
  
        <!-- TODO: 数字と英字のみ入力可能 -->
        <v-text-field
          density="compact"
          placeholder=""
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          v-model="name"
        ></v-text-field>

        <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between">
          <p class="white">
            Password
          </p>
        </div>

        <!-- TODO: 数字と英字のみ入力可能 -->
        <v-text-field
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          density="compact"
          placeholder=""
          prepend-inner-icon="mdi-lock-outline"
          variant="outlined"
          @click:append-inner="visible = !visible"
          v-model="rawPass"
        ></v-text-field>
  
        <v-btn
          class="mb-8"
          size="large"
          variant="tonal"
          block
          @click="onLogin"
        >
          Log In
        </v-btn>
  
        <v-card-text class="text-center" v-if="false">
          <a
            class="text-blue text-decoration-none"
            href="#"
            rel="noopener noreferrer"
            target="_blank"
          >
            Sign up now <v-icon icon="mdi-chevron-right"></v-icon>
          </a>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.home {
  height: 100vh;
  background-color: rgb(23, 23, 23);
}

.card-back {
  background-color: aliceblue;
}

.white {
  color: white;
}

.center {
  justify-content: center;
}

.flex {
  display: flex;
  flex-shrink: 0;
}

.card-size {
  width: 80%;
}

/* レスポンシブ */
@media (min-width: 1024px) {
}
</style>