<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppBar from '@/components/AppBar.vue';
</script>

<template>
  <AppBar />
  <main>
    <RouterView />
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: 'Roboto', sans-serif;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

main {
  padding: 16px;
}
</style>
