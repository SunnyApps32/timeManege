<template>
    <Menu pageTitle="Home" />
  
    <Calendar/>
    
</template>


<script>
import Menu from '../components/MenuBar.vue'
import Calendar from '../components/CalendarView.vue'


export default {
    components: {
        Menu,
        Calendar,

    },
   
}
</script>

<style scoped>
</style>