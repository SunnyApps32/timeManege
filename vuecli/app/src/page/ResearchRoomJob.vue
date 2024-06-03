<template>
  <div>
    <Menu pageTitle="研究室バイト" />
    <MonthBar v-on:monthYearReceiver="receiveCurrentMonth" />

    <form @submit.prevent="addNewRequest" class="request-form">
      <label>作業名: <input v-model="requestName" required></label>
      <NumberInput :value="requestInt" v-on:sendMessage="updateRequestInt"/>
      <button type="submit">登録</button>
    </form>

<br>
    <h1>申請リスト</h1>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>プロジェクト名</th>
            <th>時間</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in requestItems" :key="item.name" draggable="true"
              @dragstart="dragStart(index)" @dragover.prevent @drop="drop(index)">
            <td>{{ item.name }}</td>
            <td>{{ item.time }}</td>
            <td class="delete"><button type="button" class="deleteButton" @click="confirmRemove(index)">削除</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import Menu from '../components/MenuBar.vue'
import NumberInput from '../components/NumberInput.vue'
import MonthBar from '../components/MonthBar.vue'

export default {
  data() {
    return {
      childMessage: '',
      currentMonth: '',
      requestItems: [],
      requestName: '',
      requestInt: '',
    }
  },
  created() {

  },
  components: {
    Menu,
    NumberInput,
    MonthBar,
  },
  methods: {
    updateRequestInt(value) {
      this.requestInt = value;
    },
    receiveCurrentMonth(month) {
      this.currentMonth = month;
    },
    addNewRequest() {
      this.requestItems.push({ name: this.requestName, time: this.requestInt });
      this.requestInt = '';
      this.requestName = '';
    },
    confirmRemove(index) {
      const result = confirm('削除しますか？')
      if (!result) { return }
      this.removeRequest(index)
    },
    async removeRequest(index) {
      this.requestItems.splice(index, 1);
    },
  }
}
</script>

<style scoped>
.table-container {
  margin-top: 20px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
}
th {
  background-color: #f2f2f2;
  text-align: left;
}
.deleteButton {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}
.deleteButton:hover {
  background-color: #d32f2f;
}
</style>
