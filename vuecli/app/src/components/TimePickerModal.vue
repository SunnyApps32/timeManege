<template>
    <div v-if="show" class="modal">
      <div class="modal-content">
        <span class="close" @click="close">&times;</span>
        <h2>時間を選択してください</h2>
        <table class="forms">
        <th class="form-group">
          <div class="table-con">
            <tr for="startTime">開始時刻</tr>
            <tr>
              <select v-model="startHour" required>
                <option v-for="hour in startHours" :key="hour" :value="hour">{{ hour }}</option>
              </select>
              :
              <select v-model="startMinute" required>
                <option v-for="minute in minutes" :key="minute" :value="minute">{{ minute }}</option>
              </select>
            </tr>
          </div>
        </th>
        <th class="form-group">
          <div class="table-con">
            <tr for="endTime">終了時刻</tr>
            <tr>
              <select v-model="endHour" required>
                <option v-for="hour in endHours" :key="hour" :value="hour">{{ hour }}</option>
              </select>
              :
              <select v-model="endMinute" required>
                <option v-for="minute in minutes" :key="minute" :value="minute">{{ minute }}</option>
              </select>
            </tr>
          </div>

        </th>
    </table>
    <div>
        <button @click="save">保存</button>
      </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      show: {
        type: Boolean,
        required: true
      }
    },
    data() {
      return {
 
        startHour: '',
      startMinute: '',
      endHour: '',
      endMinute: '',
      hours: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
      minutes: Array.from({ length: 4 }, (_, i) => String(i * 15).padStart(2, '0')),
      };
    },
    computed: {
    startHours() {
      // 8時から18時までの時間のみを選択可能にする
      return this.hours.slice(8, 19);
    },
    endHours() {
      // 開始時刻よりも後の時間のみを選択可能にする
      return this.hours.slice(this.startHour ? parseInt(this.startHour) : 9, 19);
    }
  },
    methods: {
      close() {
        this.$emit('close');
      },
      save() {
        this.$emit('save', {
          startTime: `${this.startHour}:${this.startMinute}`,
          endTime: `${this.endHour}:${this.endMinute}`
        });
        this.resetForm()
        this.close();
      },
      resetForm() {
      this.startHour = '';
      this.startMinute = '';
      this.endHour = '';
      this.endMinute = '';
      this.selectedDay = '';
      this.selectedRole = '';
    },
    }
  };
  </script>
  
  <style scoped>
  .modal {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0, 0, 0);
    background-color: rgba(0, 0, 0, 0.4);
  }
  
  .modal-content {
    background-color: #fefefe;
    margin: 0% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 50%;
  }
  
  .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
  }
  
  .close:hover,
  .close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
  }

  .form-group {
  vertical-align: middle;
 
}


.table-con {
  display: inline-block;
  margin: 10px;
}

.forms {
    display:inline-block;
}


  </style>
  