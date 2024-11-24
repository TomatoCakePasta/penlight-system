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
const isSignUpMode = ref(false);

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

        console.log(res.data.session);
        // Cookieの有効期間を秒数指定 60分で自動削除
        const maxAge = 60 * 60;

        // セッションCookieを取得し、JSON形式でブラウザに保存
        document.cookie = `session=${JSON.stringify(res.data.session)}; max-age=${maxAge};`;

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

const onSignUp = () => {
  const data = {
    name: name.value,
    rawPass: rawPass.value
  }

  axios.post("/signup", data)
    .then((res) => {
      if (res.flag) {
        router.push({ name: "login" });
      }
      else {
        console.log("Failed to sign up");
      }
    })
    .catch((err) => {
      console.error("Error:", err);
    })
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
      <h1 class="white mt-10">{{ isSignUpMode ? "Sign up" : "Log in" }}</h1>
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
          @click="onSignUp"
          v-if="isSignUpMode"
        >
          Sign up
        </v-btn>
  
        <v-btn
          class="mb-8"
          size="large"
          variant="tonal"
          block
          @click="onLogin"
          v-else
        >
          Log In
        </v-btn>
  
        <v-card-text class="text-center" @click="isSignUpMode = !isSignUpMode" style="cursor: pointer;">
          <p
            class="text-blue text-decoration-none"
          >
            {{ isSignUpMode ? "Log in " : "Sign up " }}now <v-icon icon="mdi-chevron-right"></v-icon>
          </p>
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