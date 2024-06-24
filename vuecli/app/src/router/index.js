// // src/router/index.ts
// import { createRouter, createWebHashHistory } from 'vue-router';

// import ResearchRoomJob from '../page/ResearchRoomJob.vue';
// // import TA from '../page/TA.vue';
// import TimeTable from '../page/TimeTable.vue';
// // import BaseTA from '../page/BaseTA.vue';
// // import BaseTimeTable from '../page/BaseTimeTable.vue';
// import BaseSetting from '../page/BaseSettingPage.vue';
// import Home from '../page/HomePage.vue';
// import LoginView from '../page/LoginView.vue'
// import TeacherSetting from '../page/TeacherSettingPage.vue';
// import Register from '../page/RegisterPage.vue';
// import ReadyUsers from '../page/ReadyUsers.vue';
// import UserDetail from '../page/UserDetail.vue';

// import { getAuth, onAuthStateChanged } from "firebase/auth";

// const routes = [
//   {
//     path: '/',
//     name: 'Home',
//     component: Home,
//     meta: { title: 'Home', requiresAuth: true}

//   },

//   {
//     path: '/ready-users',
//     name: 'ReadyUsers',
//     component: ReadyUsers
//   },
//   {
//     path: '/user/:userId/:currentMonth_',
//     name: 'UserDetail',
//     component: UserDetail,
//     props: true
//   },
//   {
//     path: '/ResearchRoomJob',
//     name: 'ResearchRoomJob',
//     component: ResearchRoomJob,
//     meta: { title: 'ResearchRoomJob', requiresAuth: true}

//   },
 
//   {
//     path: '/TeacherSetting',
//     name: 'TeacherSetting',
//     component: TeacherSetting,
    
//     meta: { title: 'TeacherSetting', requiresAuth: true}
//   },
//   {
//     path: '/TimeTable',
//     name: 'TimeTable',
//     component: TimeTable,
//     meta: { title: 'TimeTable', requiresAuth: true}

//   },
//   {
//     path: '/register',
//     name: 'Register',
//     component: Register,
//      meta: { title: 'TimeTable', requiresAuth: false}
//   },
//   // {
//   //   path: '/BaseTA',
//   //   name: 'BaseTA',
//   //   component: BaseTA,
//   // },
//   // {
//   //   path: '/BaseTimeTable',
//   //   name: 'BaseTimeTable',
//   //   component: BaseTimeTable,
//   // },
//   {
//     path: '/BaseSetting',
//     name: 'BaseSetting',
//     component: BaseSetting,
//     meta: { title: 'BaseSetting', requiresAuth: true}

//   },
//   {
//     path: '/login',
//     name: 'login',
//     component: LoginView,
//     meta: { title: 'Login', requiresAuth: false}
// },
// ];

// const router = createRouter({
//   history: createWebHashHistory(),
//   routes,
// });


// router.afterEach((titleString) => {
//   document.title = titleString.meta.title + ' | TimeManage'
// });

// // 画面遷移前にログイン済みかをチェックして、未ログイン時はログイン画面に強制遷移させる
// let onAuthStateChangedUnsubscribe
// router.beforeEach((to, from, next) => {
//     const auth = getAuth()

//     if (!to.matched.some(record => record.meta.requiresAuth)) {
//         next()
//     } else {
//         if (auth.currentUser) {
//             next()
//             return
//         } else {
//             if (typeof onAuthStateChangedUnsubscribe === 'function') {
//                 onAuthStateChangedUnsubscribe()
//             }
//             onAuthStateChanged(auth, (user) => {
//                 if (user) {
//                     next()
//                 } else {
//                     next({ name: 'login' })
//                 }
//             })
//         }
//     }
// })

// export default router;


// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router';

import ResearchRoomJob from '../page/ResearchRoomJob.vue';
// import TA from '../page/TA.vue';
import TimeTable from '../page/TimeTable.vue';
// import BaseTA from '../page/BaseTA.vue';
// import BaseTimeTable from '../page/BaseTimeTable.vue';
import BaseSetting from '../page/BaseSettingPage.vue';

import LoginView from '../page/LoginView.vue'
import TeacherSetting from '../page/TeacherSettingPage.vue';
import Register from '../page/RegisterPage.vue';
import ReadyUsers from '../page/ReadyUsers.vue';
import UserDetail from '../page/UserDetail.vue';

import { getAuth, onAuthStateChanged } from "firebase/auth";

const routes = [
 
  {
    path: '/',
    name: 'Home',
    component: TeacherSetting,
    
    meta: { title: 'Home', requiresAuth: true}
  },

  {
    path: '/ready-users',
    name: 'ReadyUsers',
    component: ReadyUsers,
    meta: { title: '申請ユーザ一覧', requiresAuth: true}
  },
  {
    path: '/user/:userId/:currentMonth_',
    name: 'UserDetail',
    component: UserDetail,
    props: true,
    meta: { title: 'ユーザ詳細', requiresAuth: true}
  },
  {
    path: '/ResearchRoomJob',
    name: 'ResearchRoomJob',
    component: ResearchRoomJob,
    meta: { title: 'ResearchRoomJob', requiresAuth: true}

  },
 

  {
    path: '/TimeTable',
    name: 'TimeTable',
    component: TimeTable,
    meta: { title: 'TimeTable', requiresAuth: true}

  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
     meta: { title: 'TimeTable', requiresAuth: false}
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
  history: createWebHashHistory(),
  routes,
});


router.afterEach((titleString) => {
  document.title = titleString.meta.title + ' | TimeManage'
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
