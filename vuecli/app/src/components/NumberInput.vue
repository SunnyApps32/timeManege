<template>
  <input class="numInput" type="number" :value="value" @input="validate">
</template>

<script>
export default {
  name: 'IntegerStringOnlyInput',
  props: ['value'],
  watch: {
    //親からの値変更の時もサニタイズするためにwatch
    value(newValue) {
      this.$emit(newValue);
    },
  },
  mounted() {
    //this.sanitizeAndEmit(this.value);
  },
  methods: {
    validate() {
      //this.numValue = this.numValue.replace(/\D/g, '')
     
      this.$emit('input',  event.target.value);
      this.$emit('sendMessage',  event.target.value);
      console.log(this.value);
    },
    // sanitizeAndEmit() {
    //   // 数字以外を消す & 全角数字を半角数字へ変換

    //   // サニタイズされた値は直前の値と変わらないので再描画されない 強制的に再描画しないと、表示と実際の値がずれる
    //   this.$forceUpdate();
    // },
  },
};
</script>

<style>

</style>