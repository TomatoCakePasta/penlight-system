<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
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
    <RouterView />
  </div>
  <footer class="dark">
    <RouterLink to="/admin">admin</RouterLink>
  </footer>
</template>
<style scoped>
.dark {
  background-color: black;
}
</style>