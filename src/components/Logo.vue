<template>
  <img class="logo" :src="logo"></img>
</template>

<script>
import logo from "../assets/logo.jpg";
export default {
  name: "Logo",
  components: {},
  data() {
    return {
      logo,
    };
  },
  methods: {},
};
</script>

<style lang="less" scoped>
.logo {
  width: 30px;
  height: 30px;
  border-radius: 50%;
}
</style>
