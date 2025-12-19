<script>
  import { onMount } from "svelte";
  import { router, routes } from "../router";

  //onMount(() => {
  //console.log("[Splash] mounted");

  const t = setTimeout(() => {
    console.log("[Splash] timeout -> HEADPHONES");
    console.log("[Splash] unmounted");
    clearTimeout(t);
    router.go(routes.HEADPHONES);
  }, 1300);

  //});
</script>

<div class="safe">
  <div class="center">
    <div
      style="width:72px;height:72px;border-radius:18px;background:rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;"
    >
      <div
        style="width:26px;height:18px;border-radius:4px;background:rgba(59,130,246,0.35);"
      ></div>
    </div>

    <div style="margin-top:10px; max-width: 340px;">
      <p class="h1">Поленов и ученики</p>
      <p class="p" style="margin-top:8px;">
        Раскрой многогранный талант художника сквозь призму творчества его
        близких людей, коллег и единомышленников
      </p>
    </div>

    <div class="spinner" aria-label="loading"></div>

    <div class="footer">
      Государственный Владимиро-Суздальский музей-заповедник<br />
      × Сбер
    </div>
  </div>
</div>
