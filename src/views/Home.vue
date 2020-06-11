<template>
  <div id="app">
    <logo />
    <div class="hello">{{ this.$store.state.title }}</div>
  </div>
</template>

<script>
import logo from "@/components/logo.vue";
import { hello } from "@/utils/index";
export default {
  name: "App",
  components: { logo },
  data() {
    return {};
  },
  mounted() {
    console.log(hello());
  },
  methods: {},
};
</script>
