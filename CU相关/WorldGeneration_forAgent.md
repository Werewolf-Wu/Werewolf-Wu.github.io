# WorldGeneration.cs 导出接口与详细注解

> 源文件: `Assembly-Csharp_7.0.1/WorldGeneration.cs` (3829行) 游戏: Casualties: Unknown | 反编译版本 7.0.1本文档列出全部导出接口与关键私有方法，保留原标识符。描述用中文，方法名/字段名/实体名/物品名均保留英文原文。

---

## 1. 概述

### 1.1 类身份

`WorldGeneration` 继承 `MonoBehaviour`，是全局单例（`static WorldGeneration world`，在 `Awake()` 中赋值 `world = this`）。它是游戏世界的主控组件，负责：

- 世界初始化（chunk实例化、方块网格分配）
- 地形生成（按 biomeDepth 分噪声算法）
- 结构与实体分布
- 每帧运行时系统（地震、真菌沼泽雨、辐射线、温度、环境光）
- 区块可见性管理
- 爆炸系统
- 世界再生（RegenerateWorld → Clear → InstantiateWorld → GenerateWorld）

### 1.2 biomeDepth 编号定义

`amountOfLayers` 被写入两次：第262行 `= temperatureCurves.Length`，第263行覆盖为 `= 5`。实际仅5个生态层。

| biomeDepth | localeKey 前缀 | 说明 | 地形来源 | 实体来源 | 结构来源 |
| --- | --- | --- | --- | --- | --- |
| 0 | `layertitle1` | 砾石荒原 | WorldGenerateTerrain (Cellular+Perlin) | WorldPlaceEntities | WorldGenerateStructures |
| 1 | `layertitle2` | 深层砾石带 | 同上 (上层渐变sand/sandstone) | 同上 | 同上 |
| 2 | `layertitle3` | 干涸沙漠 | WorldGenerateTerrain (Value+Cellular+PingPong) | WorldPlaceEntities | WorldGenerateStructures |
| 3 | `layertitle4` | 辐射废土 | 同上 + toxirock + bricks | 同上 | 同上 |
| 4 | `layertitle5` | 深林丛渊 | WorldGenerateTerrain (Value+Ridged+Warp) | WorldPlaceEntities | WorldGenerateStructures |
| 5 | `layertitle6` | 冰封裂谷 | yield break (无地形) | 无 | WorldGenerateStructures |
| 6 | `layertitle7` | 真菌沼泽 | yield break (无地形) | 无 | WorldGenerateStructures |
| 7 | `layertitle8` | 晶化空腔 | yield break (无地形) | 无 | WorldGenerateStructures |

### 1.3 关键常量

- `CHUNKSIZE = 64` — 每个chunk的tile边长
- `width = chunkWidth * CHUNKSIZE` — 默认 16×64 = 1024
- `height = chunkHeight * CHUNKSIZE` — 默认 16×64 = 1024
- `halfWidth` / `halfHeight` — 世界中心偏移，用于坐标转换
- `HALFCHUNKSIZE = 32`

---

## 2. 公开类型定义

### 2.1 委托

| 签名 | 用途 |
| --- | --- |
| `public delegate bool PlaceCheckDelegate(Vector2Int pos)` | `DistributeEntities` 的可选位置验证回调。返回 true 时允许在该方块位置生成实体。 |

### 2.2 枚举

| 枚举 | 值 | 用途 |
| --- | --- | --- |
| `public enum OverrideSceneType` | `None`, `Tutorial`, `Debug` | 覆盖世界生成模式。`Tutorial`: 生成教程结构而非正常地形。`Debug`: 半地图solid lightrock。 |

## 3. 静态常量与单例

| 标识符 | 类型 | 初始值/来源 | 说明 |
| --- | --- | --- | --- |
| `CHUNKSIZE` | `static int` | `64` | 全局常量，chunk边长 |
| `world` | `static WorldGeneration` | `this` (Awake中赋值) | 全局单例引用 |
| `runSettings` | `static Dictionary<string, object>` | `RunSettings.GetPreset("normal").presetValues` | 运行时设置字典，在 Awake 中初始化 |
| `globalDecayRate` | `static float` | `1f` (Start中覆写) | 全局物品腐烂速率 |
| `biomeProfileNoise` | `private static float[]` | `new float[biomeProfiles.Length]` | 各生态的 FilmGrain 强度缓存，Start 中填充 |

---

## 4. 计算属性 (9个)

| 属性 | 访问 | 表达式 | 说明 |
| --- | --- | --- | --- |
| `worldExists` | `public bool` | `chunks != null && chunks.Length > 0 && !instantiatingWorld` | 世界是否可用 |
| `halfWidth` | `public uint` | `(uint)((float)width * 0.5f)` | 世界半宽 |
| `halfHeight` | `public uint` | `(uint)((float)height * 0.5f)` | 世界半高 |
| `HALFCHUNKSIZE` | `public int` | `(int)((float)CHUNKSIZE * 0.5f)` | Chunk半边长 = 32 |
| `totalLootRarity` | `public float` | `GetRunSettingFloat("baselootdensity") * lootRarityMultiplier` | 总战利品密度 |
| `totalTrapRarity` | `public float` | `GetRunSettingFloat("basetrapdensity") * trapRarityMultiplier` | 总陷阱密度 |
| `unchipped` | `public static bool` | `world.unchippedMode` | 不可被破坏模式 |
| `lineOfSightEnabled` | `public static bool` | `world.lineOfSight ? true : world.unchippedMode` | 视线系统是否启用（unchipped模式下强制启用） |
| `body` | `private Body` | `PlayerCamera.main.body` | 内部便捷访问玩家 Body 组件 |

---

## 5. 全部字段

### 5.1 public Inspector字段 (6列布局)

| 字段 | 类型 | 默认值 | 字段 | 类型 | 默认值 |
| --- | --- | --- | --- | --- | --- |
| `maxTimePerLayer` | `float` | — | `width` | `uint` | — |
| `height` | `uint` | — | `chunkWidth` | `uint` | — |
| `chunkHeight` | `uint` | — | `tiles` | `TileBase[]` | — |
| `tileColors` | `Color[]` | — | `biomeTitles` | `string[]` | — |
| `worldGrid` | `Grid` | — | `specialNullTile` | `Tile` | — |
| `defaultMat` | `Material` | — | `glowMat` | `Material` | — |
| `ambientTemperature` | `float` | `24f` | `temperatureOffset` | `float` | — |
| `blockDamageSprites` | `Sprite[]` | — | `structureDamageGrad` | `Gradient` | — |
| `loadingObject` | `GameObject` | — | `loadingText` | `TextMeshProUGUI` | — |
| `lootRarityMultiplier` | `float` | `1f` | `trapRarityMultiplier` | `float` | `1f` |
| `blockBreakPrefab` | `GameObject` | — | `temperatureCurves` | `AnimationCurve[]` | — |
| `backgroundDrones` | `AudioClip[]` | — | `currentTempCurve` | `int` | — |
| `currentCurveProgress` | `float` | — | `biomeTitle` | `TextMeshProUGUI` | — |
| `possibleFootSteps` | `string[]` | — | `skyColors` | `Gradient` | — |
| `skyMaterial` | `Material` | — | `biomeProfiles` | `VolumeProfile[]` | — |
| `tutorialProfile` | `VolumeProfile` | — | `fogMat` | `Material` | — |
| `fogSprite` | `SpriteRenderer` | — | `fogAmount` | `float` | — |
| `biomeOverride` | `OverrideSceneType` | — | `genTimePassed` | `float` | — |
| `genRects` | `RectTransform[]` | — | `genPodSource` | `AudioSource` | — |
| `soundMixerGroup` | `AudioMixerGroup` | — | `unchippedMode` | `bool` | — |
| `lineOfSight` | `bool` | — | `debugStartDepth` | `int` | — |
| `iceMap` | `Texture2D` | — | `iceGenCurve` | `AnimationCurve` | — |
| `iceMinGenCurve` | `AnimationCurve` | — | `doPod` | `bool` | — |
| `fungalRainMap` | `Texture2D` | — | `fungusRainIntensity` | `float` | — |
| `rainSprite` | `SpriteRenderer` | — | `rainLoopSource` | `AudioSource` | — |
| `earthquakeSource` | `AudioSource` | — | `earthquakeIntensity` | `float` | — |
| `earthquakeTime` | `float` | — | `earthquakeDelay` | `float` | — |
| `spawnableMagazines` | `string[]` | — | `savePanel` | `GameObject` | — |
| `forceRain` | `bool` | — | `layerTimeSpent` | `float` | — |
| `realTimeElapsed` | `float` | — | `ambientLight` | `Light2D` | — |
| `totalTraveled` | `int` | — | `biomeDepth` | `int` | — |
| `timeSinceFinishedGeneration` | `float` | — |  |  |  |

### 5.2 [HideInInspector] public字段

| 字段              | 类型                 |
| ----------------- | -------------------- |
| `renderChunks`    | `TilemapRenderer[,]` |
| `generatingWorld` | `bool`               |
| `amountOfLayers`  | `int`                |

### 5.3 public 可空字段 (new初始化)

| 字段           | 类型                | 初始值                    |
| -------------- | ------------------- | ------------------------- |
| `blockDamages` | `List<BlockDamage>` | `new List<BlockDamage>()` |
| `backgrounds`  | `List<GameObject>`  | `new List<GameObject>()`  |

### 5.4 private 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `worldBlocks` | `ushort[,]` | 方块ID网格 [width, height] |
| `chunks` | `Tilemap[,]` | [chunkWidth, chunkHeight] |
| `chunkScripts` | `ChunkScript[,]` | 对应chunk的MonoBehaviour |
| `square` | `GameObject` | `Resources.Load("Square")` 缓存 |
| `mainCam` | `Camera` | `Camera.main` |
| `lastCameraPos` | `Vector3` | 用于chunk可见性追踪 |
| `instantiatingWorld` | `bool` | 正在实例化chunk |
| `caveAudio` | `AudioSource` | `GetComponent<AudioSource>()` |
| `footstepDict` | `Dictionary<string, AudioClip[]>` | stepSoundId -> AudioClip[] |
| `skyColor` | `Color` | `skyColors.Evaluate()` 的随机颜色 |
| `doingRegen` | `bool` | 正在RegenerateWorld协程中 |
| `layerPrefix` | `string` | LayerModifier前缀，显示在layer标题 |
| `layerDescription` | `string` | LayerModifier描述文字 |
| `bonusTemperatureOffset` | `float` | 来自RunSetting `"temperatureoffset"` |

---

## 6. 生命周期方法

### 6.1 Awake() — 第243行

```csharp
private void Awake()
{
    world = this;
    if (runSettings == null) runSettings = RunSettings.GetPreset("normal").presetValues;
    ConsoleScript.CheckForConsole();
    GlobalDark.CheckForDark();
    if (PlayerPrefs.GetInt("tutorial") > 0) { PlayerPrefs.SetInt("tutorial", 0); biomeOverride = OverrideSceneType.Tutorial; }
    caveAudio = GetComponent<AudioSource>();
    Item.SetupItems();
    Recipes.SetUpRecipes();
    timeSinceFinishedGeneration = 1000f;
    footstepDict = new Dictionary<string, AudioClip[]>();
    amountOfLayers = temperatureCurves.Length;   // 行262
    amountOfLayers = 5;                            // 行263: 覆盖为5
    foreach (string text in possibleFootSteps)
        footstepDict.Add(text, Resources.LoadAll<AudioClip>("Sounds/footstep/" + text + "/"));
}
```

| 操作 | 说明 |
| --- | --- |
| `world = this` | 注册全局单例 |
| `runSettings = RunSettings.GetPreset("normal").presetValues` | 仅在 null 时初始化 |
| `ConsoleScript.CheckForConsole()` | 检测是否开启调试控制台 |
| `GlobalDark.CheckForDark()` | 检测开局黑暗效果 |
| `PlayerPrefs.GetInt("tutorial") > 0` | 读取教程标记 → biomeOverride = Tutorial |
| `Item.SetupItems()` / `Recipes.SetUpRecipes()` | 注册所有物品和配方 |
| `timeSinceFinishedGeneration = 1000f` | 初始设为极大值，避免误触发 |
| `footstepDict` 填充 | 从 Resources.LoadAll 加载各脚步声组的 AudioClip[] |
| `amountOfLayers` 双重赋值 | 行262取曲线长度，行263硬设为5 → 仅5层生效 |

### 6.2 Start() — 第357行

```csharp
private void Start()
{
    earthquakeDelay = UnityEngine.Random.Range(240f, 1000f);
    skyColor = skyColors.Evaluate(UnityEngine.Random.value);
    skyMaterial.SetColor("_TopColor", skyColor);
    skyMaterial.SetFloat("_RainIntensity", Random.value < 0.3f ? 1f : 0f);
    square = Resources.Load("Square") as GameObject;
    mainCam = Camera.main;
    biomeDepth = debugStartDepth;
    // biomeTitles 本地化
    for (int i = 0; i < biomeTitles.Length; i++)
        biomeTitles[i] = Locale.GetOther("layertitle" + (i + 1));
    SaveSystem.TryLoadGame();
    if (GetRunSettingBool("unchipped")) SetUnchipped(true);
    trapRarityMultiplier += GetRunSettingFloat("trapincrease") * (float)debugStartDepth;
    maxTimePerLayer = GetRunSettingFloat("timelimit") * 60f;
    globalDecayRate = GetRunSettingFloat("itemdecayrate");
    bonusTemperatureOffset = GetRunSettingFloat("temperatureoffset");
    FluidManager.main.liquidPushing = GetRunSettingBool("liquidpushing");
    if (GetRunSettingBool("debugworld")) { chunkHeight = 4u; chunkWidth = 4u; }
    else { chunkWidth = 16u; chunkHeight = 16u; }
    // FilmGrain缓存
    if (biomeProfileNoise == null) {
        biomeProfileNoise = new float[biomeProfiles.Length];
        for (int j = 0; j < biomeProfiles.Length; j++) {
            if (biomeProfiles[j].TryGet<FilmGrain>(out var c))
                biomeProfileNoise[j] = c.intensity.value;
            else biomeProfileNoise[j] = 0f;
        }
    }
    StartCoroutine("InstantiateWorld", true);
}
```

| 操作 | 变量/公式 |
| --- | --- |
| `earthquakeDelay` | `Random.Range(240f, 1000f)` |
| `skyColor` → skyMaterial | `skyColors.Evaluate(Random.value)`; 30%下雨 |
| RunSetting初始化 | `trapRarityMultiplier`, `maxTimePerLayer`, `globalDecayRate`, `bonusTemperatureOffset`, `FluidManager.main.liquidPushing` |
| chunk尺寸 | debugworld=true → 4×4; false → 16×16 (1024×1024世界) |
| `biomeProfileNoise` | 缓存各生态的 FilmGrain.intensity.value |
| 启程 | `StartCoroutine("InstantiateWorld", true)` — 进入世界生成管线 |

### 6.3 OnDestroy() — 第286行

```csharp
private void OnDestroy() { worldBlocks = null; }
```

### 6.4 Update() — 第901行 (运行时主循环)

涉及变量和运行时系统如下：

```csharp
private void Update()
{
    realTimeElapsed += Time.unscaledDeltaTime;
    layerTimeSpent += Time.deltaTime;

    // [1] RadiationLine触发
    if (layerTimeSpent > maxTimePerLayer && !RadiationLine.line.active && biomeOverride == None)
        RadiationLine.line.Activate();

    // [2] 地震系统
    earthquakeDelay -= Time.deltaTime;
    if (earthquakeDelay < 0f && biomeOverride == None && !body.sleeping) {
        earthquakeDelay = Random.Range(600f, 1750f) * GetRunSettingFloat("timebetweenearthquakes");
        earthquakeTime = Random.Range(3f, 25f);
        Time.timeScale = 1f;
    }
    earthquakeTime -= Time.deltaTime;
    earthquakeIntensity = Mathf.MoveTowards(earthquakeIntensity, earthquakeTime > 0f ? 1f : 0f, Time.deltaTime * 0.1f);
    if (earthquakeIntensity > 0f) {
        // 概率屏幕震动 (8/dt)
        PlayerCamera.main.shaker.Shake(earthquakeIntensity * 20f);
        if (body.standing)
            body.rb.velocity += Random.insideUnitCircle * earthquakeIntensity * 10f * (body.grounded ? 2.5f : 1f);
        else
            foreach limb in body.limbs: limb.rb.velocity += Random.insideUnitCircle * earthquakeIntensity * 10f;
        // 概率方块塌陷 (16*earthquakeIntensity/dt)
        SetBlock(WorldToBlockPos(body.pos + Random.insideUnitCircle * Random.Range(5f, 30f)), 0);
        if (earthquakeIntensity > 0.5f) body.eyeScareTime = 1f;
    }
    earthquakeSource.volume = earthquakeIntensity;

    // [3] 真菌沼泽雨 (biomeDepth==6 或 forceRain)
    if (biomeDepth == 6 || forceRain) {
        fungusRainIntensity = fungalRainMap.GetPixelBilinear(posAsUV).r;
        body.wetness = MoveTowards(body.wetness, fungusRainIntensity*100f, dt);
        body.dirtyness = MoveTowards(body.dirtyness, 0f, dt*fungusRainIntensity);
        // 概率雨滴 (dt*fungusRainIntensity)
        PlayerCamera.main.SetDroplets(Color.white);
        rainSprite.color = new Color(1f,1f,1f,fungusRainIntensity);
        rainLoopSource.volume = fungusRainIntensity;
    }

    // [4] FixedDeltaTime: TimeScale>=5且全黑 → 0.05s; 否则0.02s
    Time.fixedDeltaTime = (Time.timeScale >= 5f && PlayerCamera.main.blackAmount >= 1f) ? 0.05f : 0.02f;

    // [5] 温度
    timeSinceFinishedGeneration += Time.deltaTime;
    ambientTemperature = temperatureCurves[currentTempCurve].Evaluate(Time.timeSinceLevelLoad) + temperatureOffset + bonusTemperatureOffset;

    // [6] Chunk可见性
    if (chunks != null && Vector3.SqrMagnitude(mainCam.transform.position - lastCameraPos) > HALFCHUNKSIZE) {
        lastCameraPos = mainCam.transform.position;
        if (worldExists) UpdateChunkVisibility();
    }

    // [7] 生成动画 UI (genPod, genRects)
    if (generatingWorld || instantiatingWorld) { /* 摇摆pod + 进度条 */ }
    else { genTimePassed = 0f; genPodSource.Stop(); }

    // [8] 积雪 (biomeDepth==5, body.temperature < 32.5f)
    body.snowAmount = MoveTowards(body.snowAmount, biomeDepth==5&&body.temperature<32.5f?1f:0f, dt*0.0125f / dt*0.02f);

    // [9] 保存面板
    if (!savePanel.active && !doingRegen && !generatingWorld && worldExists && body.y < (-halfHeight+3.1f) && biomeOverride != Tutorial)
    { savePanel.SetActive(true); body.forceWalk = true; }

    UpdateAmbientLight();
}
```

| 系统 | 触发条件 | 核心操作 |
| --- | --- | --- |
| RadiationLine | `layerTimeSpent > maxTimePerLayer` | `RadiationLine.line.Activate()` |
| 地震 | `earthquakeDelay<0` | 延时 600-1750×timebetweenearthquakes, 持续 3-25s, 震级 0→1→0, 影响物理速度+方块塌陷+眼部恐慌 |
| 真菌沼泽雨 | `biomeDepth==6` 或 `forceRain` | `fungalRainMap` 采样 → 玩家潮湿/去污 → 屏幕雨滴 → rainSprite/rainLoopSource 透明度/音量 |
| 温度 | 每帧 | `temperatureCurves[currentTempCurve].Evaluate(Time.timeSinceLevelLoad) + temperatureOffset + bonusTemperatureOffset` |
| 积雪 | biome5 且低温 | body.snowAmount 向1或0渐变 |
| 保存面板 | 玩家到达底部3.1格内 | 显示面板、强制行走 |
| 环境光 | 每帧 UpdateAmbientLight() | ambientintensity 0.12/0.4/0.7(全亮或失明) |

---

## 7. 世界生成管线 (按执行顺序)

### 7.1 入口方法

#### ContinueRun() — 第1051行

保存面板按钮回调。`body.forceWalk = false`, `savePanel.SetActive(false)`, `PlayerPrefs.SetInt("deepestlayer", max(biomeDepth+1, ...))`, `StartCoroutine(RegenerateWorld())`。

#### SaveAndExit() — 第1065行

退出按钮回调。`body.forceWalk = false`, 写入 deepestlayer, `IncreaseDepthByLayer()`, `SaveSystem.SaveGame()`, `PlayerCamera.main.ToMainMenu()`。

#### IncreaseDepthByLayer() — 第1110行

```csharp
public void IncreaseDepthByLayer()
{
    totalTraveled += (int)((float)height * 0.3f);
    body.skills.AddExp(2, 80f);  // INT技能 +80经验
}
```

#### RegenerateWorld(bool twice=false) — 第1081行

```csharp
public IEnumerator RegenerateWorld(bool twice = false)
{
    doingRegen = true;
    GlobalDark.main.Darken(); yield return new WaitUntil(() => !GlobalDark.main.IsDarkening());
    IncreaseDepthByLayer();
    if (twice) IncreaseDepthByLayer();
    biomeDepth += twice ? 2 : 1;
    if (biomeDepth >= amountOfLayers - 1) biomeDepth = 1;  // 循环
    PlayerPrefs.SetInt("deepestlayer", max(biomeDepth, ...));
    lootRarityMultiplier *= GetRunSettingFloat("lootmultiplier");
    trapRarityMultiplier += GetRunSettingFloat("trapincrease");
    yield return Clear();
    doingRegen = false;
    yield return InstantiateWorld(true);
}
```

调用者: `ContinueRun()` (biomeDepth+1), `DrillPod.cs:22` (twice=true → biomeDepth+2)。

#### ReloadScene() — 第1074行 (私有, 无调用者)

```csharp
private IEnumerator ReloadScene()
{
    yield return Clear();
    Time.timeScale = 1f;
    SceneManager.LoadScene(SceneManager.GetActiveScene().name);
}
```

### 7.2 Clear() — 第1119行

```csharp
public IEnumerator Clear()
{
    loadingObject.SetActive(true);
    SetLoadingText("genclearingworld");
    generatingWorld = true;
    yield return null;
    // 销毁所有 BuildingEntity
    foreach (var be in Object.FindObjectsOfType<BuildingEntity>()) Object.Destroy(be.gameObject);
    // 销毁游离物品 (无父或父名="DOSPAWN")
    foreach (var it in Item.allItems) if (it.transform.parent == null || it.transform.parent.name == "DOSPAWN") Object.Destroy(it.gameObject);
    yield return null;
    // 销毁背景元素
    backgrounds.Clear();
    foreach (Transform t in worldGrid.transform) Object.Destroy(t.gameObject);
    generatingWorld = false;
    chunks = null;
}
```

### 7.3 InstantiateWorld(bool generate) — 第3567行

世界构建的基础协程。创建所有chunk和数据结构。

```csharp
private IEnumerator InstantiateWorld(bool generate)
{
    loadingObject.SetActive(true);
    SetLoadingText("geninstantiatingchunks");
    instantiatingWorld = true;
    generatingWorld = true;

    width = chunkWidth * (uint)CHUNKSIZE;   // 16×64 = 1024
    height = chunkHeight * (uint)CHUNKSIZE;  // 16×64 = 1024
    FluidManager.main.fluid = new byte[width, height];
    worldBlocks = new ushort[width, height];
    chunks = new Tilemap[chunkWidth, chunkHeight];
    renderChunks = new TilemapRenderer[chunkWidth, chunkHeight];
    ChunkUpdated = new UnityEvent[chunkWidth, chunkHeight];
    chunkScripts = new ChunkScript[chunkWidth, chunkHeight];

    backgrounds.Clear();
    RadiationLine.line.Deactivate();
    foreach (var bd in blockDamages) bd.DestroySprite();
    blockDamages.Clear();

    yield return null;

    for (int w = 0; w < chunkWidth; w++) {
        for (int i = 0; i < chunkHeight; i++) {
            GameObject go = new GameObject("Chunk", typeof(Tilemap), typeof(TilemapRenderer), typeof(TilemapCollider2D));
            go.isStatic = true;
            go.layer = 6;                 // Ground layer
            go.tag = "BlockGround";
            go.AddComponent<Rigidbody2D>().bodyType = RigidbodyType2D.Static;
            go.AddComponent<CompositeCollider2D>();
            var tm = go.GetComponent<Tilemap>();
            var tmr = go.GetComponent<TilemapRenderer>();
            var tmc = go.GetComponent<TilemapCollider2D>();
            tmc.extrusionFactor = 0.0005f;
            tmc.maximumTileChangeCount = 99999u;
            tmr.detectChunkCullingBounds = TilemapRenderer.DetectChunkCullingBounds.Manual;
            tmr.material = defaultMat;
            tmr.sortingOrder = 1000;
            chunks[w, i] = tm;
            renderChunks[w, i] = tmr;
            go.transform.position = new Vector2(
                ((float)w - (float)chunkWidth * 0.5f) * CHUNKSIZE + HALFCHUNKSIZE,
                ((float)i - (float)chunkHeight * 0.5f) * CHUNKSIZE + HALFCHUNKSIZE);
            go.transform.SetParent(worldGrid.transform);
            ChunkUpdated[w, i] = new UnityEvent();
            tmr.enabled = false;
            go.AddComponent<ChunkScript>().pos = new Vector2Int(w, i);
            chunkScripts[w, i] = go.GetComponent<ChunkScript>();
        }
        yield return 0;
    }
    generatingWorld = false;
    instantiatingWorld = false;
    loadingObject.SetActive(false);
    UpdateChunkVisibility();
    if (generate) StartCoroutine(GenerateWorld());
}
```

| 步骤 | 分配/操作 |
| --- | --- |
| 1 | 分配 `worldBlocks` (ushort), `FluidManager.fluid` (byte), 四个chunk数组 |
| 2 | 清空 `backgrounds`, `blockDamages`, 停 RadiationLine |
| 3 | 逐chunk创建 GameObject: Tilemap+TilemapRenderer+TilemapCollider2D+Rigidbody2D+CompositeCollider2D |
| 4 | 每chunk设置位置: `(w-chunkWidth/2)*64+32` |
| 5 | 添加 ChunkScript 组件, 创建 ChunkUpdated UnityEvent |
| 6 | 初始渲染器 enabled=false |
| 7 | 完成 → 若 generate=true, 启动 GenerateWorld() 协程 |

### 7.4 GenerateWorld() — 第1578行 (主生成协程)

```csharp
private IEnumerator GenerateWorld()
{
    loadingObject.SetActive(true);
    generatingWorld = true;
    yield return WorldPreprocess();
    yield return WorldCreateBackground();
    yield return WorldGenerateTerrain();
    yield return WorldGenerateWorldBorders();
    SetLoadingText("gencreatingcolliders");
    yield return null;
    UpdateWorld();
    yield return WorldPlacePlayer();
    yield return WorldPlaceEntities();
    yield return FinishWorldGeneration();
}
```

执行顺序: WorldPreprocess → WorldCreateBackground → WorldGenerateTerrain → WorldGenerateWorldBorders → 加载文字 → UpdateWorld → WorldPlacePlayer → WorldPlaceEntities → FinishWorldGeneration。

#### 7.4.1 WorldPreprocess() — 第3077行

- `PlayerCamera.main.body.transform.position = Vector3.zero` — 玩家归零
- `currentTempCurve = biomeDepth` — 设定温度曲线索引
- `UpdateBiomePostProcess()` — 应用生态 VolumeProfile
- 若 biomeOverride==None: `ResetLayerModifiers()` — 清空 layerPrefix/layerDescription, Disable 所有活跃 LayerModifier
- `PlayerCamera.main.backgroundSnow.SetActive(biomeDepth == 5)` — 冰封裂谷背景

#### 7.4.2 WorldCreateBackground() — 第3024行

| biomeOverride / biomeDepth | 背景资源 | 额外效果 |
| --- | --- | --- |
| Tutorial | `steelBackground` | — |
| biomeDepth 0 | `rockBackground` | 40%密度创建 `Special/wallholes` (随机音高) |
| biomeDepth 1 | `soilBackground` | — |
| biomeDepth 2 | `sandBackground` | — |
| biomeDepth 3 | `wastelandBackground` | — |
| biomeDepth 4 | `grassBackground` | — |
| biomeDepth 5/6/7 | yield break | 无背景 |

每个背景通过 `CreateBackground(path, chunk)` 以 Tiled SpriteRenderer 附加到每个chunk。

#### 7.4.3 WorldGenerateWorldBorders() — 第1861行

左右各8列: 概率 `1.0f - columnIndex × 0.125f` → `worldBlocks[col, row] = 14` (infinirock)。逐列概率递减（第一列100%，第八列12.5%），形成锯齿状边界。

---

## 8. WorldGenerateTerrain — 按biome详细拆解

所有噪声对象均为 `new FastNoiseLite(Random.Range(0, int.MaxValue))`，每局随机种子不同。

### 8.1 biomeOverride == Tutorial (第2518行)

- `GenerateObjectAtPosFast(Vector2Int.one*(int)halfWidth, "Special/TutorialStructure" 的 Tilemap)`
- `GenerateEntityAtPos(Vector2.one*0.5f, "Special/TutorialStructure")`
- 无其他地形。

### 8.2 biomeOverride == Debug (第2522行)

- 遍历 worldBlocks[i,j]: `if (j < halfHeight) worldBlocks[i,j] = 1(lightrock)`
- 每100个tile yield一次。

### 8.3 biomeDepth ≤ 1 — 洞穴/表层 (第2541行)

| 噪声 | 类型 | 频率 | Fractal | 用途 |
| --- | --- | --- | --- | --- |
| `caveNoise` | Cellular | 0.06 + frequencyMap\*0.01 | FBm, octaves=3, lacunarity=1.5 | 主洞穴形态 |
| `dirtPerlinNoise` | Perlin | 0.035 | FBm, octaves=7 | 泥土/砾石分布 |
| `frequencyMap` | Perlin | 0.00037 | — | 频率偏移 |
| `biomeMap` | Cellular | 0.04 | Ridged, lacunarity=1.5, Distance=EuclideanSq, ReturnType=Distance, Jitter=1 | 废料/黏土区域 |

判定逻辑 (逐tile):

1. `caveNoise > -0.715` → lightrock(1); else → air(0)
2. non-air + `dirtPerlin < -0.1` → gravel(2); < -0.33 → soil(16)
3. non-air + 1%概率 → Random(1,5) (scrappile/trashpile变体)
4. `biomeMap > 0.1` → Random(3,5) (废料区)
5. non-air + `biomeMap < -0.8` → clay(15)
6. **仅 biomeDepth=1**: 上半部(k<height*0.5): gravel→sand(12), 概率=k/height*2; 上1/3: lightrock→sandstone(13), 概率=k/height\*3
7. GenerateOres()
8. **biomeDepth>0**: 水平混凝土条(5): 6-64长×3高, 密度0.35-0.5; 垂直混凝土条: 3宽×6-60高, 密度0.35-0.5
9. **biomeDepth=0**: 水平木条(11): 6-48长×2高, 密度0.35-0.4; 垂直木条: 2宽×6-48高, 密度0.35-0.4
10. UpdateWorld() → WorldGenerateStructures()
11. PlaceLiquids: biome0 → (128, 1, 32) water; biome1 → (10, 1, 400) water + (18, 2, 128)

### 8.4 biomeDepth 2 or 3 — 干涸沙漠/辐射废土 (第2690行)

| 噪声 | 类型 | 频率 | Fractal | DomainWarp | 用途 |
| --- | --- | --- | --- | --- | --- |
| `biomeMap` | Value | 0.086 | FBm, octaves=2(2)/3(3), gain=0.49, weighted=2.34 | OpenSimplex2, amp=22 | 主地形 |
| `frequencyMap` | Perlin | 0.006 | — | — | 偏移 |
| `dirtPerlinNoise` | Cellular | 0.02 | Ridged, gain=0.65 | — | 泥土 |
| `caveNoise` | Perlin | 0.005 | PingPong, gain=0.35 | BasicGrid, amp=40 | 花岗岩洞穴 |
| `toxicNoise` | Perlin | 0.012 | PingPong, gain=0.3 | BasicGrid, amp=50 | 毒石 (depth3) |
| `biomeMap2` | Cellular | 0.05 | Ridged, lacunarity=1.5, Distance=EuclideanSq, ReturnType=Distance, Jitter=1 | — | 废料区 |
| `marbleMap` | Perlin | 0.007(2)/0.035(3) | — | OpenSimplex2, amp=100 | 大理岩/石灰岩分界线 |

判定逻辑:

1. 若 `marbleMap ≤ minMarble` (`0.45/d2`, `1/d3`): 非大理岩带
   - `biomeMap > frequencyMap*0.25+0.1 && dirtPerlin < -0.4` → sand(12); 边界 → sandstone(13)
   - `caveNoise > 0.65` → granite(17)
   - `biomeMap > 0.75` → clay(15)
   - `biomeMap2 > 0.1` → Random(3,5)
   - depth3: 10% → clay(15)或soil(16)
2. 否则 (大理岩带): `biomeMap > threshold` → marble(18)或limestone(19) (dirtPerlin>-0.1→19,else→18); 每100tile生成 `"Special/marbleBackground"` 实体
3. depth3: `toxicNoise < -0.8 && Random>0.5` → toxirock(22); 上半部→grass(23) 概率=(y+halfHeight)/height
4. GenerateOres()
5. 木条(11): 6-48×1-2, 密度0.25-0.3; depth3额外砖块(20): 4-16×4-16, 密度0.5-0.6
6. UpdateWorld() → WorldGenerateStructures()
7. PlaceLiquids: (50, 1, 26) water + (15, 3, 128)

### 8.5 biomeDepth 4 — 深林丛渊 (第2850行)

| 噪声 | 类型 | 频率 | Fractal | DomainWarp |
| --- | --- | --- | --- | --- |
| `marbleMap` | Value | 0.0189 - y/height\*0.002 | Ridged, octaves=3, lacunarity=2.29, gain=4, weighted=1.2 | OpenSimplex2, amp=41 |
| `biomeMap2` | Perlin | 0.02 | — | OpenSimplex2, amp=25 |

判定逻辑:

1. `marbleNoise + Random(-0.1,0.1)` 映射: 0.15~0.25→grass(23), 0.25~0.45→soil(16), 0.45~0.66→clay(15), ≥0.66→limestone(19)
2. `biomeMap2 < -0.735` → air(0)
3. GenerateOres() → UpdateWorld() → WorldGenerateStructures()
4. PlaceLiquids: (30, 1, 128) water + (10, 2, 50)

### 8.6 biomeDepth 5(Snow), 6(Fungus), 7(Crystal)

**全部立即 `yield break`** — WorldGenerateTerrain 不产生任何地形方块。这些层仅通过 WorldGenerateStructures 和 WorldGenerateWorldBorders 填充内容。

---

## 9. WorldPlacePlayer — 玩家放置与初始物资 (第1891行)

- `PlayerCamera.main.body.PlaceBody()` — 放置玩家
- **仅首层** (totalTraveled≤0, biomeOverride==None, debugStartDepth==0):
  - `GenerateBlockCircle(body.position, 30, block=3(scrappile), chance=0.8, chanceEnd=0)` — 废料凹坑
  - `GenerateBlockCircle(body.position, 36, block=4(trashpile), chance=0.3, chanceEnd=0)` — 垃圾环
  - `GenerateBlockCircle(body.position, 30, block=0(air), chance=0.15, chanceEnd=0)` — 挖空
  - `GenerateObjectAtPos(WorldToBlockPos(body+up*4), "LifepodStart" Tilemap, 0.97f)`
  - `GenerateEntityAtPos(BlockToWorldPos(...), "Lifepod")`
  - Instantiate `"LifepodStart"` child[0].child[0] (逃生舱开启部件)
  - **初始物资** (由 RunSetting `"startingsupplies"` 决定):
    - 1: `"emergencylight"` → body.slot 3
    - 2: `"lantern"` slot 3 + `"dogfood"` slot 4 + `"waterbottle"` slot 5 + `"trashbag"` slot 1
  - **12月彩蛋**: `"present"` + `"Special/holidaytree"`

---

## 10. WorldPlaceEntities — 按biome实体分布 (第1594行)

所有实体名保留原 Resources.Load 字符串。密度受 `totalLootRarity` / `totalTrapRarity` / `lootRarityMultiplier` 缩放。

### 10.1 biomeDepth ≤ 1 (砾石荒原/深层砾石带)

| 实体 | 密度 (minPerChunk, maxPerChunk) | 特殊参数 |
| --- | --- | --- |
| PlaceCrystals() | 5个随机水晶 | 见下方水晶列表 |
| `"glowplant"` | 2.7, 3.5 | spYOff=1.25, rot=10, dev=0.25, flip, check: block<3\|\|isSoil |
| `"stoneplant"` | 0.4, 0.5 | spYOff=1.9, rot=10, dev=0.1, flip, check: block<3\|\|isSoil |
| `"ceilingrye"` | 0.3, 0.4 | spYOff=1, rot=10, dev=0.5, flip, dir=Vector2.up, check: block<3\|\|isSoil |
| `"medcrate"` | 0.18*L, 0.2*L | spYOff=3, rot=180 |
| `"containercrate"` | 0.05*L, 0.07*L | spYOff=3, rot=180 |
| `"foodbox"` | 0.1*L, 0.13*L | spYOff=3, rot=180 |
| `"spikestabber"` | 0.4*T, 0.5*T | isTrap |
| `"shadecrawler"` | 0.4*T, 0.42*T | spYOff=2, rot=180, isTrap |
| `"corpse"` | 1*R, 1.1*R | check: block>0 && left>0 && right>0 |
| `"animalcorpse"` | 0.6*R, 0.7*R | 同上check |
| `"drillpod"` | 0.09, 0.1 | spInGround, flip, isTrap |
| `"geotree"` | 2.7, 3 | spYOff=3, rot=6, dev=0.15, flip, check: isSoil |
| `"hydreed"` | 1.4, 1.6 | spYOff=2.6, rot=6, dev=0.4, flip, check: isSoil |
| `"leadbush"` | 2, 2.2 | spYOff=0.6, rot=6, dev=0.1, flip, check: isSoil |
| `"jumppad"` | 0.6*T, 0.8*T | isTrap |
| (手动循环) `"bandage"` | chunkCount*Random(0.2,0.3)*L | condition=Random(1,4)\*0.33, 地面raycast |
| (手动循环) `"climbingropeextended"` | chunkCount\*Random(0.8,1) | Linecast到地, Climbable.points |
| (手动循环) `"droppings"` | chunkCount\*Random(0.3,0.5) | 地面raycast |
| (biome0专属循环) `"fleshchunk"` | chunkCount*Random(0.015,0.02)*L | 地面raycast |

若 **biomeDepth > 0** (第二洞穴层) 追加:

| 实体                | 密度                                           |
| ------------------- | ---------------------------------------------- |
| `"barbedwirefence"` | 0.6*T, 0.8*T, spYOff=4.8, isTrap               |
| `"beartrap"`        | 0.2*T, 0.25*T, spYOff=1, isTrap                |
| `"CaveTicks"`       | 0.15*T, 0.2*T, spYOff=4, dev=3, isTrap         |
| `"geyser"`          | 1.6, 1.8, spYOff=0.6, check: block<3\|\|isSoil |

否则 **biomeDepth = 0**:

| 实体       | 密度                                           |
| ---------- | ---------------------------------------------- |
| `"geyser"` | 0.7, 0.8, spYOff=0.6, check: block<3\|\|isSoil |

> 注: L = totalLootRarity, T = totalTrapRarity, R = lootRarityMultiplier

### 10.2 biomeDepth 2 (干涸沙漠)

| 实体 | 密度 | 特注 |
| --- | --- | --- |
| PlaceCrystals() | — |  |
| `"glowplant"` | 2.4, 2.5, spYOff=1.25, rot=10, dev=0.25, flip, check: block==12\|\|13\|\|isSoil |  |
| `"stoneplant"` | 0.4, 0.5, spYOff=1.9, rot=10, dev=0.1, flip, check: block==12\|\|13\|\|isSoil |  |
| `"cactus"` | 1.4, 1.6, spYOff=2.1, rot=10, dev=0.3, flip |  |
| `"sandrose"` | 1.3, 1.4, spYOff=1.5, rot=10, flip |  |
| `"drybush"` | 6, 7, spYOff=2, rot=20, flip |  |
| `"brownshroom"` | 4, 5, spYOff=0.9, rot=10, flip |  |
| `"stalagmite"` | 10, 15, spYOff=2.8, dev=0.15, flip, check: block==18\|\|17\|\|19 | 生长在marble/granite/limestone上 |
| `"jumppad"` | 0.25*T, 0.35*T, isTrap |  |
| `"landmine"` | 0.13*T, 0.16*T, spYOff=0.4, isTrap |  |
| `"ceilingrye"` | 0.08, 0.1, spYOff=1, rot=10, dev=0.5, flip, dir=up |  |
| `"wallbiter"` | 0.12*T, 0.13*T, spYOff=4.8, isTrap |  |
| `"shadecrawler"` | 0.2*T, 0.2*T, spYOff=4.8, isTrap |  |
| `"droppings"` | 0.75, 0.82 |  |
| `"beartrap"` | 0.1*T, 0.2*T, spYOff=1, isTrap |  |
| `"barbedwirefence"` | 0.7*T, 0.8*T, spYOff=4.8, isTrap |  |
| (手动) `"oilpipe"` | chunkCount\*Random(0.3,0.4), 随机旋转 |  |
| (手动) `"turret"` | chunkCount*Random(0.12,0.15)*T, 水平raycast贴墙 |  |
| (手动) `"stalactite"` | chunkCount*Random(1.5,2)*T, 向上raycast天花板, StalactiteDropper, 随机flip |  |
| (手动) sandvine bridge | chunkCount*Random(6,7), 上下raycast, `"Special/sandvinehook"`+`"Special/sandvinerope"`, Climbable+downwardsVelocity=(1-scale)*16 |  |
| `"rag"` | 0.12*R, 0.2*R, spYOff=1 |  |
| `"corpse"` | 0.75*R, 0.82*R, check: block>0&&left>0&&right>0 |  |

### 10.3 biomeDepth 3 (辐射废土) — 同depth2基础上变化

| 变化项        | 系数 |
| ------------- | ---- |
| stoneplant    | ×3   |
| corpse        | ×2   |
| rag           | ×2.5 |
| CollapsedPods | ×2.5 |

追加实体:

| 实体 | 密度 |
| --- | --- |
| `"spentfuel"` | 0.3*T, 0.35*T, spYOff=1.875, isTrap |
| `"soundcannon"` | 0.4*T, 0.45*T, spYOff=1, isTrap |
| `"foodbox"` | 0.1*L, 0.13*L, spYOff=3, rot=180 |
| `"pop"` | 3*L, 4*L, spYOff=2, rot=20, dev=0.2, flip, check: block==12\|\|13\|\|isSoil |
| `"coil"` | 0.2*T, 0.3*T, spYOff=2, isTrap |

### 10.4 biomeDepth 4 (深林丛渊)

| 实体 | 密度 | 特注 |
| --- | --- | --- |
| (手动) sandvine bridge | chunkCount\*Random(4,5), 上下raycast, `"Special/sandvinehook"`+`"Special/sandvinerope"`, Climbable | 与depth2相同但密度较低 |
| `"glowplant"` | 0.2, 0.3 | spYOff=1.25, rot=10, dev=0.25, flip, check: isSoil |
| `"shadecrawler"` | 0.45*T, 0.5*T | spYOff=2, rot=180, isTrap |
| `"wallbiter"` | 0.1*T, 0.11*T | spYOff=4.8, isTrap |
| `"thornbackyoung"` | 0.24*T, 0.26*T | spYOff=4.8, isTrap |
| `"overgrowntick"` | 0.1*T, 0.12*T | spYOff=4.8, isTrap |
| `"caveticks"` | 0.15*T, 0.16*T | spYOff=4.8, isTrap |
| `"thornbackelder"` | 硬编码3只 | 非DistributeEntities，直接 Instantiate |
| `"stoneplant"` | 0.4, 0.5 | spYOff=1.9, rot=10, dev=0.1, flip, check: isSoil |
| `"ceilingrye"` | 0.65, 0.8 | spYOff=1, rot=10, dev=0.5, flip, dir=up, check: block<3\|\|isSoil |
| `"medcrate"` | 0.18*L, 0.2*L | spYOff=3, rot=180 |
| `"containercrate"` | 0.05*L, 0.07*L | spYOff=3, rot=180 |
| `"foodbox"` | 0.1*L, 0.13*L | spYOff=3, rot=180 |
| `"corpse"` | 1.1*R, 1.2*R | check: block>0&&left>0&&right>0 |
| `"animalcorpse"` | 0.9*R, 0.95*R | 同上check |
| `"geotree"` | 0.4, 0.5 | spYOff=3, rot=6, dev=0.15, flip, check: isSoil |
| `"browncap"` | 0.4, 0.5 | spYOff=3, rot=6, dev=0.15, flip, check: isSoil |
| `"hydreed"` | 0.6, 0.7 | spYOff=2.6, rot=6, dev=0.4, flip, check: isSoil |
| `"leadbush"` | 1.1, 1.2 | spYOff=0.6, rot=6, dev=0.1, flip, check: isSoil |
| `"droppings"` | 3.7, 4 |  |
| `"pop"` | 1*L, 1.1*L | spYOff=2, rot=20, dev=0.2, flip, check: isSoil |
| `"bananaplant"` | 1.9*T, 2*T | spYOff=0.4, rot=15, dev=0.1, flip, check: isSoil |
| `"coil"` | 0.2*T, 0.3*T | spYOff=2, isTrap |
| `"beartrap"` | 0.1*T, 0.2*T | spYOff=1, isTrap |
| `"jumppad"` | 0.25*T, 0.35*T | isTrap |
| `"spikestabber"` | 0.4*T, 0.5*T | isTrap |
| `"grabberplant"` | 0.4*T, 0.5*T | isTrap |
| `"geyser"` | 0.7, 0.8 | spYOff=0.6, check: block<3\|\|isSoil |
| `"skullcrusher"` | 1.1, 1.2 | spYOff=1, rot=10, flip, dir=Vector2.up |
| (手动) `"wallflower"` | chunkCount\*Random(6,7) | 随机旋转 |
| PlaceCrystals() | — |  |

### 10.5 biomeOverride == Debug

| 实体             | 位置                     |
| ---------------- | ------------------------ |
| `"LifePodLight"` | body.pos + up\*10, 180度 |

### 10.6 biomeDepth 5, 6, 7

**WorldPlaceEntities 中全部落入空白分支**，不生成任何实体。仅有结构 (WorldGenerateStructures)。

---

## 11. WorldGenerateStructures — 按biome结构生成 (第1924行)

### 11.1 结构资源名清单

| Resource Path | Type | 说明 |
| --- | --- | --- |
| `"LifepodStart"` | Tilemap + Entity | biome0首层起始逃生舱 |
| `"Lifepod"` | Tilemap + Entity | 完整逃生舱 (含商人或宝箱) |
| `"LifepodCollapsed"` | Tilemap + Entity | 坍塌逃生舱 |
| `"BioContainer"` | Tilemap + Entity | 生物容器 |
| `"Structures/SteelBridge"` | Tilemap + Entity | 钢制平台 |
| `"Structures/CratePod"` | Tilemap + Entity | 货柜舱 |
| `"Structures/MiniPod"` | Tilemap + Entity | 小型舱体 |
| `"Structures/SteelThing"` | Tilemap only | 钢结构 (无Entity生成) |
| `"Structures/WoodCross"` | Tilemap only | 木制十字架 |
| `"Structures/WoodHorizontal"` | Tilemap only | 水平木质结构 |
| `"Structures/MedicalBuilding"` | Tilemap + Entity | 医疗建筑 (depth2-3专属) |
| `"Structures/BrickLoot"` | Tilemap + Entity | 砖块战利品建筑 (depth4专属) |
| `"Structures/LongCorridor"` | Tilemap + Entity | 长走廊 (depth7专属) |
| `"Structures/CrystalSpawnPlatform"` | Tilemap + Entity | 水晶生成平台 (depth7专属) |
| `"Special/TutorialStructure"` | Tilemap + Entity | 教程结构 (Tutorial专属) |

每个结构生成前通常先用三个 GenerateBlockCircle 创建凹坑: scrappile(3)半径16→trashpile(4)半径20→air(0)半径16。

### 11.2 biome 0-1 (洞穴)

| 结构 | 密度 (×chunkCount) | 备注 |
| --- | --- | --- |
| `GenerateDropCapsules(Random(0.12,0.13))` | — | 全局 |
| `GenerateCollapsedPods(Random(0.055,0.066))` | — | 全局 |
| 若 biomeDepth>0: |  |  |
| `"BioContainer"` | Random(0.05,0.07)\*L, chance=1 |  |
| `"Structures/SteelBridge"` | Random(0.09,0.12)\*L, chance=0.85 |  |
| `"Structures/CratePod"` | Random(0.06,0.08)\*L, chance=0.82 |  |
| `"Structures/MiniPod"` | 同上数量, chance=0.88 |  |
| `"Structures/SteelThing"` | Random(0.045,0.05)\*L, chance=0.9 |  |
| `"Structures/WoodCross"` | Random(0.03,0.05)\*L, chance=0.94 |  |
| `"Structures/WoodHorizontal"` | Random(0.03,0.05)\*L, chance=0.94 |  |
| `GenerateLifePods(Random(0.088,0.1))` | — | 全局 |

### 11.3 biomeDepth 2-3 (干涸沙漠/辐射废土)

| 结构 | 密度 | 备注 |
| --- | --- | --- |
| DropCapsules(Random(0.12,0.13)) | — |  |
| CollapsedPods(Random(0.066,0.077)\*depth3x2.5) | — | depth3 密度×2.5 |
| `"BioContainer"` | Random(0.05,0.07)\*L |  |
| `"Structures/MedicalBuilding"` | Random(0.04,0.05)\*L, chance=0.98 | depth2-3专属 |
| `"Structures/SteelBridge"` | Random(0.09,0.12)\*L, chance=0.95 |  |
| `"Structures/MiniPod"` | 同上, chance=0.88 |  |
| `"Structures/WoodCross"` | Random(0.03,0.05)\*L, chance=0.94 |  |
| `"Structures/WoodHorizontal"` | Random(0.03,0.05)\*L, chance=0.94 |  |
| GenerateLifePods(Random(0.088,0.1)) | — |  |

### 11.4 biomeDepth 4 (深林丛渊)

| 结构 | 密度 |
| --- | --- |
| DropCapsules(Random(0.12,0.13)) | — |
| CollapsedPods(Random(0.066,0.077)) | — |
| `GenerateTree` (RaycastDown) | Random(0.9,1.1)\*chunkCount |
| `"Structures/CratePod"` | Random(0.06,0.08)\*L, chance=0.82 |
| `"Structures/MiniPod"` | 同上, chance=0.88 |
| `"Structures/WoodCross"` | Random(0.03,0.05)\*L, chance=0.95 |
| `"Structures/WoodHorizontal"` | Random(0.03,0.05)\*L, chance=0.95 |
| `"Structures/BrickLoot"` | Random(0.04,0.05)\*L, chance=0.925 |
| `"BioContainer"` | Random(0.03,0.04)\*L, chance=0.975 |
| 混凝土条(ID5) | Random(0.35,0.5)\*chunkCount ×2方向: 水平1-4宽, 垂直2宽 |
| GenerateLifePods(Random(0.088,0.1)) | — |

### 11.5 biomeDepth 5 (冰封裂谷)

- DropCapsules + CollapsedPods
- CratePod, MiniPod, **SteelThing** (替换 SteelBridge), WoodCross, WoodHorizontal
- LifePods
- (无BioContainer, 无SteelBridge)

### 11.6 biomeDepth 6 (真菌沼泽)

- `GenerateBigMushroom` (RaycastDown, 密度 Random(0.9,1.1)\*chunkCount)
- DropCapsules + CollapsedPods
- BioContainer, SteelBridge, MiniPod, WoodCross, WoodHorizontal
- LifePods

### 11.7 biomeDepth 7 (晶化空腔)

- DropCapsules (0.12-0.13) + **CollapsedPods 密度2倍 (0.15-0.2)**
- CratePod, MiniPod, SteelThing, WoodCross, WoodHorizontal
- BioContainer, SteelBridge
- **`"Structures/LongCorridor"`** — 密度 Random(0.07,0.1)\*chunkCount, chance=0.95
- **`"Structures/CrystalSpawnPlatform"`** — 1个实例, 固定位置: `new Vector2Int((int)halfWidth, (int)(height-30))`
- (无 LifePods)

---

## 12. 子生成器

### 12.1 GenerateOres() — 第3473行

- **copper (ID 34)**: 矿脉数 = `Mathf.RoundToInt(chunkWidth*chunkHeight/2 * GetRunSettingFloat("oreamount"))`。每脉 1-25格随机游走，覆写 non-air 方块。
- **ilmenite (ID 35)**, 仅在 biomeDepth ≥ 4: 散落单格。每 `1024/clamp(oreamount, 0.01, 999)` 格有 0.1% 概率覆写 non-air 方块。

### 12.2 GenerateTree(Vector2Int pos) — 第3323行

从ground位置向上生长 12-60步，每步宽度 1-9。

- 17%概率宽度±1 (随机变宽/变窄)
- 50%概率 X轴漂移 ±1
- 宽度 >2: 中间 tile → air(0) + `FluidManager.main.fluid[pos] = 4` (sap)
- 95%概率 Y轴+1
- log方块 (ID 24)
- 生长结束后: 10-20簇 leaves (ID 25)，每簇半径 4-8, `GenerateBlockCircle(force=true)` 覆写

### 12.3 GenerateBigMushroom(Vector2Int pos) — 第3376行

15-85步，宽度 2-5。

- 初始方向 = `Random.insideUnitCircle.normalized`
- 每2步方向微调 ±0.3 然后重新 normalize
- mushroombody (ID 32), 使用 `SetBlockNoUpdate` 写入
- 生长结束后: 10-20簇 mushroomcap (ID 33)，每簇半径 4-8, `GenerateBlockCircle(force=true)`

### 12.4 GenerateCollapsedPods(float amt) — 第3122行

| 步骤 | 操作 |
| --- | --- |
| 1 | 数量 = `chunkWidth*chunkHeight*amt*totalLootRarity` |
| 2 | 随机位置射线找地 → 90×90 crater: 随机方块(0-4), 概率=12/(distance\*0.8) |
| 3 | `GenerateObjectAtPos` → `"LifepodCollapsed"` Tilemap (chance=0.88, genMode) |
| 4 | 掉落: 90% → `spawnableMagazines.PickRandom()` 弹药; 3×30% → `"experimentflesh"`; 80% → `"internalorgans"` |

### 12.5 GenerateLifePods(float amt) — 第3190行

| 步骤 | 操作 |
| --- | --- |
| 1 | 数量 = `chunkWidth*chunkHeight*amt*totalLootRarity` |
| 2 | 同 crater 逻辑 (45半径) |
| 3 | `GenerateObjectAtPos` → `"Lifepod"` Tilemap (chance=0.95, genMode) + `GenerateEntityAtPos` → `"Lifepod"` 实体 |
| 4 | **概率出 trader** (`Random < traderchance*0.01`): `"trader"+Random(1,4)` (trader1-3), `MoveRange = BlockToWorldPos(pos +/- right*5)` |
| 5 | 否则出 `"lifepodchest"` (宝箱) |
| 6 | 3×5% → `"experimentflesh"`; 5% → `"internalorgans"`; 50% → `"LoreNote"`; 28.5% → `"epda"` |
| 7 | 20% → 除颤器: 75% `"manualdefibrillator"`+ItemLock / 25% `"aed"`+ItemLock, 50%电池已耗尽 |

### 12.6 GenerateDropCapsules(float amt) — 第3302行

- 数量 = `chunkWidth*chunkHeight*amt*totalLootRarity`
- 随机位置射线 → Instantiate `"dropcapsule"`, 随机旋转, 随机音高(0.9-1.1)
- 嵌套 crater: `GenerateBlockCircle(vec,32,3,0.7,0)` + `(30,6,0.04,0.04)` + `(4,0,1,0.9)`

### 12.7 DistributeMiniBarrels() — 第3091行

- 数量 = `chunkWidth*chunkHeight*Random(0.18,0.2)*lootRarityMultiplier`
- 随机位置 → RayCast → Instantiate `"minibarrel"`
- 液体: `RoundToInt(Random.value * Random.value * 8)` 决定 1-8 种液体
- 每种液体: `Liquids.Registry.ElementAt(Random.Range(0, Liquids.Registry.Count)).Key` 随机选Key
- 每次添加量: `Random.value * 10000f / num2 * Random.value`

---

## 13. FinishWorldGeneration() — 第3409行

```csharp
private IEnumerator FinishWorldGeneration()
{
    layerTimeSpent = 0f;
    RadiationLine.line.Deactivate();

    // doPod: 由 DrillPod.cs 使用钻探仓后设为 true
    if (doPod) {
        doPod = false;
        body.hearingLoss += 15f;
        body.hunger -= 10f;
        body.thirst -= 15f;
        body.talker.Talk(Locale.GetCharacter("drillend"));
        Instantiate("drillpodbroken", body.pos+down*2, randomZ);
    }

    GlobalDark.main.Darken();
    if (biomeOverride == None) DistributeMiniBarrels();
    yield return new WaitUntil(() => !GlobalDark.main.IsDarkening());
    if (biomeOverride == None) ApplyLayerModifiers();

    generatingWorld = false;
    caveAudio.Stop();
    caveAudio.clip = backgroundDrones[biomeDepth];
    caveAudio.Play();
    DisableAllChunks();
    UpdateChunkVisibility();
    timeSinceFinishedGeneration = 0f;
    loadingObject.SetActive(false);

    // 层标题提示
    string text = Locale.GetOther("layer") + " " + (biomeDepth+1) + "\n" + biomeTitles[biomeDepth];
    if (!string.IsNullOrEmpty(layerPrefix)) {
        text = Locale.GetOther("layer") + " " + (biomeDepth+1) + "\n" + "<color=orange>" + layerPrefix + "</color> " + biomeTitles[biomeDepth];
        PlayerCamera.main.StartCoroutine(PlayerCamera.main.DoAlertDelayed("<color=orange>" + layerDescription + "</color>", false, 6f));
    }
    PlayerCamera.main.DoAlert(text, true);

    // biome0首层特效
    if (biomeDepth == 0 && biomeOverride == None) {
        Sound.Play("lifePodHit", ..., 2D);
        Invoke("LifePodShake", 1f);
        Instantiate("Special/ExplosionParticle", body.pos+down*11);
    }
    // biome5雾
    if (biomeDepth == 5) SetFog(Random.Range(0.8f, 1f));
}
```

---

## 14. 方块系统 (公开API)

### 14.1 坐标转换

| 方法 | 签名 | 实现 |
| --- | --- | --- |
| WorldToBlockPos | public Vector2Int WorldToBlockPos(Vector2 pos) | new Vector2Int((int)(pos.x+halfWidth), (int)(pos.y+halfHeight)) |
| BlockToWorldPos | public Vector2 BlockToWorldPos(Vector2Int pos) | new Vector2(pos.x-halfWidth+0.5f, pos.y-halfHeight+0.5f) |
| BlockToChunkPos | public Vector2Int BlockToChunkPos(Vector2Int pos) | new Vector2Int(Clamp(pos.x/CHUNKSIZE,...,0/...,chunkWidth-1/chunkHeight-1)) |

### 14.2 方块读写

| 方法 | 行为 |
| --- | --- |
| public ushort GetBlock(Vector2Int pos) | worldBlocks[Clamp(pos.x,0,width-1), Clamp(pos.y,0,height-1)] |
| public ushort GetBlock(Vector2 pos) | overload -> GetBlock(WorldToBlockPos(pos)) |
| public void SetBlock(Vector2Int pos, ushort block) | Clamp pos -> worldBlocks[pos.x,pos.y]=block -> UpdateChunkClosest(pos) |
| public void SetBlockNoUpdate(Vector2Int pos, ushort block) | Clamp pos.x到[0,width-2], pos.y到[0,height-2], 直接写入worldBlocks, 不触发chunk更新 |
| private void UpdateTile(Vector2Int pos) | GetClosestChunk(pos).SetTile(pos%CHUNKSIZE, tiles[GetBlock(pos)]) |

### 14.3 方块破坏

| 方法 | 行为 |
| --- | --- |
| public void DamageBlock(Vector2Int pos, float dmg, bool hitSound=true, bool bonusMetal=false, bool ignoreLoot=false) | 详见下方 |
| public void DamageBlock(Vector2 pos, ...) | overload -> DamageBlock(WorldToBlockPos(pos), ...) |
| public BlockDamage GetBlockDamage(Vector2Int pos) | blockDamages.Where(x => x.pos == pos).FirstOrDefault() |
| public void ClearBlockDamages() | foreach blockDamages -> DestroySprite(), 然后 Clear() |
| public bool isSoil(Vector2Int pos) | block in {2,15,16,23} 或 30<block<34 -> true |

#### DamageBlock 核心逻辑

1. 若 bonusMetal && blockInfo.metallic: dmg \*= 10f
2. 从 blockDamages 列表查找或创建 BlockDamage 对象，累积伤害。列表上限128，超出时销毁最旧项。
3. UpdateSprite() 更新损伤精灵
4. 若 blockDamage.damage >= blockInfo.health:
   - 播放 hitsound + stepsound
   - 从chunk获取sprite -> 生成 blockBreakPrefab 粒子
   - 若 !ignoreLoot, 根据方块ID掉落:

| 方块ID                  | 掉落                                        | 概率 |
| ----------------------- | ------------------------------------------- | ---- |
| 7 (glass)               | "glassshards"                               | 40%  |
| 3 (scrappile)           | "scrapmetal", condition=0.05-0.2            | 50%  |
| 6 (steeltile)           | "scrapmetal", condition=0.5-1               | 75%  |
| 10 (heatresistantalloy) | "scrapmetal", condition=0.5-1               | 75%  |
| 27 (ice)                | FluidManager.main.fluid[pos]=1 (water)      | 50%  |
| 8/9 (rubber/plastic)    | "plasticchunk"                              | 50%  |
| 11/24 (wood/log)        | "woodscraps" / "stick" / "woodpanel" (随机) | 100% |
| 34 (copper)             | "rawcopper"                                 | 100% |
| 35 (ilmenite)           | "ilmenitechunk"                             | 100% |

- SetBlock(pos, 0), 生成 "DustBig" 粒子, 从列表移除

5. 若未破坏且 hitSound: 仅播放 hitsound

### 14.4 GetBlockInfo — 36种Block属性参考

| ID | localeKey | health | hitsound | stepsound | 特殊属性 |
| --- | --- | --- | --- | --- | --- |
| 0 | air | 0 | — | Rock |  |
| 1 | lightrock | 100 | rock | Rock |  |
| 2 | gravel | 25 | dirt | Gravel |  |
| 3 | scrappile | 60 | scrapmetal | Scrap |  |
| 4 | trashpile | 20 | trash | Scrap |  |
| 5 | concretetile | 800 | concrete | Concrete |  |
| 6 | steeltile | 5000 | steel | Steel | metallic |
| 7 | glass | 30 | glass | Glass | noVariation |
| 8 | rubber | 60 | rubber | Rubber |  |
| 9 | plastic | 150 | rubber | Plastic |  |
| 10 | heatresistantalloy | 15000 | steel | Steel | metallic |
| 11 | wood | 150 | wood | Wood | noVariation |
| 12 | sand | 15 | sand | Sand |  |
| 13 | sandstone | 90 | rock | Rock |  |
| 14 | infinirock | 420133760 | rock | Rock |  |
| 15 | clay | 25 | sand | Sand |  |
| 16 | soil | 32 | dirt | Gravel |  |
| 17 | granite | 200 | rock | Concrete |  |
| 18 | marble | 150 | rock | Concrete |  |
| 19 | limestone | 135 | rock | Concrete |  |
| 20 | bricks | 650 | concrete | Concrete | noVariation |
| 21 | scaffolding | 200 | steel | Steel | noVariation, metallic |
| 22 | toxirock | 250 | rock | Concrete | toxicity=2.5 |
| 23 | grass | 35 | rustle | Grass |  |
| 24 | log | 150 | wood | Wood | noVariation |
| 25 | leaves | 20 | rustle | Grass |  |
| 26 | snow | 15 | sand | Snow |  |
| 27 | ice | 50 | glass | Ice | slippery |
| 28 | thinice | 1 | glass | Ice | slippery |
| 29 | powdersnow | 1 | sand | Snow |  |
| 30 | heavyrock | 200 | rock | Rock |  |
| 31 | fungus | 50 | gore2 | Grass |  |
| 32 | mushroombody | 80 | gore2 | Plastic |  |
| 33 | mushroomcap | 60 | gore2 | Plastic |  |
| 34 | copper | 2000 | crystal | Rock |  |
| 35 | ilmenite | 4000 | rock | Rock |  |

ID > 35 -> null。所有BlockInfo还含 Body.SleepQuality 字段。

## 15. Chunk 系统

| 方法 | 行为 |
| --- | --- |
| public Tilemap GetClosestChunk(Vector2Int pos) | chunks[Clamp(pos.x/CHUNKSIZE,...), Clamp(pos.y/CHUNKSIZE,...)] |
| public ChunkScript GetClosestChunkScript(Vector2Int pos) | 同上, 索引 chunkScripts[,] |
| public ChunkScript GetClosestChunkScript(Vector2 poss) | overload -> WorldToBlockPos -> chunkScripts[,] |
| public TilemapRenderer GetClosestChunkRenderer(Vector2Int pos) | 同上, 索引 renderChunks[,] |
| public void UpdateChunkClosest(Vector2Int pos) | -> UpdateChunk(new Vector2Int(pos.x/CHUNKSIZE, pos.y/CHUNKSIZE)) |
| public void UpdateChunk(Vector2Int chunk) | 遍历chunk内64x64 tile: chunks[x,y].SetTile(posInChunk, tiles[worldBlocks[...]]), 然后 ChunkUpdated[x,y].Invoke() |
| public void UpdateChunkVisibility() | 摄像机tile -> 视口 +/- (3,4) chunk启用, 边界chunk禁用 |
| public void UpdateWorld() | 遍历全部[width,height] -> 刷新所有chunk的 SetTile 从 worldBlocks |
| public void DisableAllChunks() | 所有 TilemapRenderer.enabled = false |
| public void RandomizeTileTransforms() | lehmer64 PRNG -> 每个tile随机旋转 0/90/180/270度 |
| public static ulong lehmer64(ulong state) | state \* 15750249268501108917uL |

---

## 16. 实体/结构生成 (公开工具方法)

### 16.1 DistributeEntities — 核心分布函数

```csharp
public void DistributeEntities(
    GameObject basObj,
    float minPerChunk,
    float maxPerChunk,
    float spawnYOffset = 0f,
    float randomRotation = 0f,
    float spawnYOffsetDeviation = 0f,
    bool spawnInGround = false,
    bool randomFlip = false,
    PlaceCheckDelegate checkFunc = null,
    bool isTrap = false,
    Vector2 dir = default(Vector2),
    bool forceFlip = false)
```

流程:

1. 数量 = chunkWidth _ chunkHeight _ Random(minPerChunk, maxPerChunk)
2. 逐个随机位置 -> Physics2D.OverlapPoint 检测 (若 spawnInGround, 允许与Ground重叠; 否则跳过重叠位置)
3. Physics2D.Raycast 沿 dir 方向检测地面 (默认 Vector2.down)
4. 边界检测: hitPoint 必须在世界边界内 (-halfWidth+1 到 halfWidth-1)
5. 若 checkFunc != null, 调用 checkFunc(WorldToBlockPos(hitPoint - up\*0.5)) 检查
6. isTrap=true: Y坐标上限 = body.transform.position.y - 5f (不生成在玩家上方)
7. Instantiate(basObj, hitPoint - dir \* Random(spawnYOffset +/- deviation), 旋转+/-randomRotation)
8. 若为 BuildingEntity: 设置 blockPlacedOn, 注册 ChunkUpdated 事件监听
9. randomFlip: 50%概率 X缩放 -1; forceFlip: 始终 -1

### 16.2 放置工具

| 方法 | 行为 |
| --- | --- | --- | --- | --- | --- |
| public void PlaceCrystals() | 从数组 {"BloodCrystal","SoothingCrystal","ReliefCrystal","TurbulentCrystal","OxygenCrystal","EmissiveCrystal","DigestionCrystal"} 随机5个, DistributeEntities(0.015,0.015,spYOff=2,flip) |
| public void PlaceLiquids(float perChunk, byte type, int maxFill) | 数量 = chunkWidth*chunkHeight*perChunk, 随机位置 -> FluidManager.main.StartFill(WorldToBlockPos(pos), type, maxFill) |
| public void GenerateObjectAtPos(Vector2Int pos, Tilemap tilemap, float blockChance=1f, bool genMode=false) | 复制 tilemap 的 tile 到 worldBlocks (或 SetBlock)。specialNullTile -> air(0)。genMode=true: 直接写入worldBlocks; false: 使用SetBlock |
| public void GenerateObjectAtPosFast(Vector2Int pos, Tilemap tilemap) | 同上但预建 Dictionary<TileBase,ushort> 加速查找, 始终直接写入worldBlocks |
| public void GenerateEntityAtPos(Vector2 pos, GameObject basObj) | 遍历 basObj.transform 子节点: 若为 Item/BuildingEntity/名"DOSPAWN" -> Instantiate at pos+localPosition。若有Tilemap组件 -> parent到worldGrid.transform |
| public void GenerateBlockCircle(Vector2 pos, int size, ushort block, float chance, float chanceEnd, bool autoUpdateChunk=false, bool force=false, bool ignoreInfinirock=false) | size*2xsize*2圆域, 概率 Lerp(chance,chanceEnd,distance/size)。写入条件: (worldBlocks>0&&(!ignoreInfinirock |  | block!=14)) |  | force。autoUpdateChunk: 使用SetBlock; 否则直接写 |
| public void SimpleBlockCircle(Vector2Int pos, int size, ushort block) | 无条件圆形替换, 直接worldBlocks[,]=block |
| public void DrawLine(in Vector2Int a, in Vector2Int b, int thickness, ushort block) | Bresenham直线, thickness宽度, worldBlocks[,]=block |
| public void DrawEmptyLine(in Vector2Int a, in Vector2Int b, int thickness) | 同上但worldBlocks[,]=0 |

---

## 17. 视觉 / 音频

| 方法 | 行为 |
| --- | --- |
| public void CreateHitFlash(Sprite sprite, Vector2 pos, Quaternion rot, Color clr, Transform follow=null) | Instantiate "Special/HitFlash", 设follow/sprite/clr |
| public AudioClip RandomStepSound(string step) | footstepDict[step][Random.Range(0, len)] |
| public void CreateBackground(string path, Tilemap chunk, int sortOffset=0, bool glow=false) | 创建GameObject "ChunkBack" with SpriteRenderer tiled, size=CHUNKSIZE, sortingOrder=-9999+sortOffset, material=glow?glowMat:defaultMat, 加入backgrounds列表 |
| public void UpdateAllBackgroundColors() | foreach backgrounds -> GetBackgroundColor() |
| public Color GetBackgroundColor() | Setting "darkerbackground" ? (0.2,0.2,0.2) : Color.gray |
| public void SetLoadingText(string localetext) | loadingText.text = Locale.GetOther(localetext) |
| public void SetLoadingTextNoLocale(string text) | loadingText.text = text (无本地化) |
| public void SetFog(float fog) | fogAmount=fog, fogSprite.color=(0.8,0.8,0.8,fogAmount) |
| public void UpdateBiomePostProcess() | PlayerCamera.main.volume.profile = biomeProfiles[biomeDepth]或tutorialProfile; FilmGrain.intensity = biomeProfileNoise[...] \* SettingFloat("filmgrain"); Bloom.active = SettingBool("bloom") |
| public void ApplyLayerModifiers() | 概率 layermodifierchance\*0.01 -> 从 LayerModifier.availableModifiers 随机选 (biomeDepth<=1过滤hideOnFirstLayer) -> Initialize(this) -> active=true -> layerPrefix/layerDescription赋值 |
| public void ResetLayerModifiers() | layerPrefix/layerDescription 清空, foreach LayerModifier -> Disable(this) -> active=false |

---

## 18. RunSetting 访问器与全部被引用Key

### 18.1 访问器

| 方法 | 实现 |
| --- | --- |
| public static float GetRunSettingFloat(string name) | (float)runSettings[name] |
| public static bool GetRunSettingBool(string name) | (bool)runSettings[name] |
| public static int GetRunSettingInt(string name) | (int)runSettings[name] |
| public static float TotalRunTime() | SaveSystem.savedRunTime + Time.timeSinceLevelLoad |

### 18.2 全部被引用的 RunSetting Key

| Key | 类型 | 被调用位置 |
| --- | --- | --- |
| "baselootdensity" | float | totalLootRarity 属性 |
| "basetrapdensity" | float | totalTrapRarity 属性 |
| "unchipped" | bool | Start(): SetUnchipped(true) |
| "trapincrease" | float | Start(): trapRarityMultiplier, RegenerateWorld(): trapRarityMultiplier |
| "timelimit" | float | Start(): maxTimePerLayer = \*60 |
| "itemdecayrate" | float | Start(): globalDecayRate |
| "temperatureoffset" | float | Start(): bonusTemperatureOffset |
| "liquidpushing" | bool | Start(): FluidManager.main.liquidPushing |
| "debugworld" | bool | Start(): chunk尺寸 4x4 vs 16x16 |
| "startingsupplies" | int | WorldPlacePlayer(): 1=emergencylight, 2=lantern+dogfood+waterbottle+trashbag |
| "lootmultiplier" | float | RegenerateWorld(): lootRarityMultiplier \*= ... |
| "traderchance" | float | GenerateLifePods(): trader生成概率 \*0.01 |
| "oreamount" | float | GenerateOres(): 矿脉数量缩放 |
| "layermodifierchance" | float | ApplyLayerModifiers(): 概率 \*0.01 |
| "timebetweenearthquakes" | float | Update(): 地震间隔乘数 |
| "ambientlight" | int | UpdateAmbientLight(): 1->0.12, 2->0.4, 特殊情况0.7 |
| "filmgrain" | float | UpdateBiomePostProcess(): from Settings |
| "bloom" | bool | UpdateBiomePostProcess(): from Settings |

---

## 19. 战斗/破坏

| 方法 | 行为 |
| --- | --- |
| public static void CreateDamageNumber(Vector2 pos, int num) | Instantiate "DamageText", text=num.ToString(), color=world.structureDamageGrad.Evaluate(num\*0.01f), Destroy(obj, 0.5f) |
| public bool Linecast(Vector2 startWorld, Vector2 endWorld, out Vector2 hitEntryPosition, out float distance) | DDA方块遍历。遇非air非glass(ID>0&&!=7)方块: 检查4邻域有无air/glass -> 有则不阻挡(防止单格误判), 无则返回true+碰撞点/距离。穿通则false。 |
| public static void CreateExplosion(ExplosionParams param) | 完整爆炸系统。5阶段: 音视频 -> 近距离冲击波(耳鸣/意识31/听力损失27-36.6) -> Collider扫描(BuildingEntity损失 structuralDamage*Random(0,2); Item损失 condition-0.5%*Random(0,1.3)) -> 地形破坏(GenerateBlockCircle, circle, air, 1.0->0.85, ignoreInfinirock=true) -> 肢体伤害(Linecast遮挡判定 + 护甲除法减伤 + 骨折/脱臼/毁容/头部特判)。详见独立参考文档 WorldGeneration.CreateExplosion_summary_forAgent.md。 |

---

## 20. 废弃/预留字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| iceMap | Texture2D | 在全部269个.cs文件中从未被任何代码读取。可能用于冰封裂谷地形但未实现。 |
| iceGenCurve | AnimationCurve | 同上 |
| iceMinGenCurve | AnimationCurve | 同上 |
| currentCurveProgress | float | 声明于行106，但 WorldGeneration.cs 内部从未读取。 |

---

## 21. 关键外部调用者

| 调用者 | 调用的方法/字段 | 说明 |
| --- | --- | --- |
| DrillPod.cs | world.doPod = true; StartCoroutine("RegenerateWorld", true) | 钻探仓使用触发 |
| MineScript.cs | CreateExplosion(ExplosionParams) | 地雷爆炸 |
| CrystalUnstable.cs | CreateExplosion(ExplosionParams) | 不稳定水晶爆炸 |
| TurretScript.cs | CreateExplosion(ExplosionParams) | 炮塔自毁爆炸 |
| CustomItemBehaviour.cs | CreateExplosion(ExplosionParams) | 炸药棒/重力袋爆炸 |
| KeypadMinigame.cs | CreateExplosion(ExplosionParams) | "2296"彩蛋爆炸 |
| ConsoleScript.cs | CreateExplosion(ExplosionParams) | explode命令 |
| Body.cs | GetRunSettingFloat/Bool/Int, totalLootRarity, world | 多系统引用 |
| BleedParticle.cs | GetBlock, WorldToBlockPos | 地面方块检测 |
| BuildingEntity.cs | GetBlockInfo, WorldToBlockPos, chunk可见性 | 结构放置验证 |
| TraderScript.cs | GetRunSettingFloat | 商人物品生成 |
| FluidManager.cs | world, WorldToBlockPos | 液体流动 |

---

## 22. 依赖文件索引

| 文件 | 角色 |
| --- | --- |
| ExplosionParams.cs | 爆炸参数数据类 |
| FastNoiseLite.cs | 噪声库 (OpenSimplex2, Cellular, Perlin, Value, PingPong等) |
| BlockInfo.cs | 方块元数据 (health, sounds, flags) |
| BlockDamage.cs | 单方块累积损伤状态 |
| ChunkScript.cs | 每chunk的MonoBehaviour组件 |
| FluidManager.cs | 液体网格与填充 |
| BuildingEntity.cs | 放置结构的组件 (health, 位置验证) |
| Body.cs | 玩家身体 (limbs, skills, 状态) |
| PlayerCamera.cs | 主摄像机, shaker, UI, body引用 |
| RadiationLine.cs | 向上推进的致命辐射线 |
| GlobalDark.cs | 屏幕暗化过渡 |
| LayerModifier.cs | 生态层修改器插件系统 |
| RunSettings.cs | 运行时设置预设 |
| SaveSystem.cs | 存档/读档 |
| Liquids.cs | 液体注册表 |
| Utils.cs | 工具 (Create) |
| Item.cs | 物品生命周期与 allItems 列表 |
| TraderScript.cs | 商人NPC |
| Locale.cs | 本地化查找 |
| Talker.cs | 角色对话气泡 |
| LifepodController.cs | 逃生舱功能 |
| Climbable.cs | 攀爬绳/藤物理 |
| StalactiteDropper.cs | 钟乳石掉落行为 |
| MineScript.cs | 地雷陷阱 |
| TurretScript.cs | 炮塔陷阱 |
| DrillPod.cs | 钻探仓实体 |
| Settings.cs | 玩家设置 (SettingBool, SettingFloat等) |
