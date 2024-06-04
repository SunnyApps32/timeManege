<template>
    <Menu pageTitle="Home" />
  
    <TeacherCalendar/>
    
</template>


<script>
import Menu from '../components/MenuBar.vue'
import TeacherCalendar from '../components/TeacherCalendarView.vue'


export default {
    components: {
        Menu,
        TeacherCalendar,

    }
}
</script>

<style scoped>
</style>