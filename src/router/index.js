import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

function Views(view) {
  return () =>
    import(/* webpackChunkName: "view-[request]" */ `@/views/${view}.vue`);
}

const routes = [
  {
    path: "/",
    component: { render: (h) => h("router-view") },
    redirect: "/home",
    children: [
      {
        path: "home",
        component: Views('Home'),
      },
      {
        path: "404",
        component: Views('Error'),
      },
    ],
  },
  {
    path: "*",
    redirect: "/404",
  },
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes,
});

export default router;
