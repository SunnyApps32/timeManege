// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

import ResearchRoomJob from '../page/ResearchRoomJob.vue';
// import TA from '../page/TA.vue';
import TimeTable from '../page/TimeTable.vue';
// import BaseTA from '../page/BaseTA.vue';
// import BaseTimeTable from '../page/BaseTimeTable.vue';
import BaseSetting from '../page/BaseSettingPage.vue';
import Home from '../page/HomePage.vue';
import LoginView from '../page/LoginView.vue'
import TeacherSetting from '../page/TeacherSettingPage.vue';

import { getAuth, onAuthStateChanged } from "firebase/auth";

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: 'Home', requiresAuth: true}

  },
  {
    path: '/ResearchRoomJob',
    name: 'ResearchRoomJob',
    component: ResearchRoomJob,
    meta: { title: 'ResearchRoomJob', requiresAuth: true}

  },
 
  {
    path: '/TeacherSetting',
    name: 'TeacherSetting',
    component: TeacherSetting,
    
    meta: { title: 'TeacherSetting', requiresAuth: true}
  },
  {
    path: '/TimeTable',
    name: 'TimeTable',
    component: TimeTable,
    meta: { title: 'TimeTable', requiresAuth: true}

  },
  // {
  //   path: '/BaseTA',
  //   name: 'BaseTA',
  //   component: BaseTA,
  // },
  // {
  //   path: '/BaseTimeTable',
  //   name: 'BaseTimeTable',
  //   component: BaseTimeTable,
  // },
  {
    path: '/BaseSetting',
    name: 'BaseSetting',
    component: BaseSetting,
    meta: { title: 'BaseSetting', requiresAuth: true}

  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Login', requiresAuth: false}
},
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


router.afterEach((titleString) => {
  document.title = titleString.meta.title + ' | Make TimeTable'
});

// 画面遷移前にログイン済みかをチェックして、未ログイン時はログイン画面に強制遷移させる
let onAuthStateChangedUnsubscribe
router.beforeEach((to, from, next) => {
    const auth = getAuth()

    if (!to.matched.some(record => record.meta.requiresAuth)) {
        next()
    } else {
        if (auth.currentUser) {
            next()
            return
        } else {
            if (typeof onAuthStateChangedUnsubscribe === 'function') {
                onAuthStateChangedUnsubscribe()
            }
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    next()
                } else {
                    next({ name: 'login' })
                }
            })
        }
    }
})

export default router;
