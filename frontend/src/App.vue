<script setup>
import { ref } from "vue"
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import io from "socket.io-client";

const PORT = 3000;
const url = `${import.meta.env.VITE_APP_URL}:${PORT}`;

// const socket = io.connect(`127.0.0.1:${PORT}`);
const socket = io.connect(url)
const lightColor = ref("blue")

const msg = "test message"
</script>

<template>
  <!-- <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/"></RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/live">Live</RouterLink>
      </nav>
    </div>
  </header> -->
  <div>
    <RouterView :socket="socket" :url="url"/>
  </div>
</template>
<style scoped>
.dark {
  /* background-color: black; */
  background-color: rgb(23, 23, 23);
}
</style>