<template>
  <button class="nextButton" @click="prevMonth">&lt;</button>
  {{ formatterMonth }}
  <button class="nextButton" @click="nextMonth">&gt;</button>
</template>

<script>
export default {
  data() {
    return {
      currentMonth: new Date(),
      formatterMonth: "",
    };
  },
  created() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth(),
      1
    );
    this.updateFormatterMonth();
  },
  methods: {
    prevMonth() {
      this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
      this.updateFormatterMonth();
    },
    nextMonth() {
      this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
      this.updateFormatterMonth();
    },
    updateFormatterMonth() {
      this.formatterMonth = `${this.currentMonth.getFullYear()}年${
        this.currentMonth.getMonth() + 1
      }月`;
      this.$emit(
        "monthYearReceiver",
        `${this.currentMonth.getFullYear()}-${this.currentMonth.getMonth() + 1}`
      );
      this.$emit("yearReceiver", this.currentMonth.getFullYear());
      this.$emit("monthReceiver", this.currentMonth.getMonth() + 1);
    },
  },
};
</script>

<style scoped>
.nextButton {
  cursor: pointer;
}
</style>
