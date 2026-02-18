import * as FRAGS from "@thatopen/fragments";
import * as BUI from "@thatopen/ui";
import * as OBC from "./obc-stub.js"; // using local stub for OBC

(async () => {
  const components = new OBC.Components();

  const worlds = components.get(OBC.Worlds);
  const world = worlds.create();

  world.scene = new OBC.SimpleScene(components);
  world.scene.setup();
  world.scene.three.background = null;

  const container = document.getElementById("container");
  world.renderer = new OBC.SimpleRenderer(components, container);
  world.camera = new OBC.OrthoPerspectiveCamera(components);
  await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);

  components.init();

  const githubUrl =
    "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
  const fetchedUrl = await fetch(githubUrl);
  const workerBlob = await fetchedUrl.blob();
  const workerFile = new File([workerBlob], "worker.mjs", {
    type: "text/javascript",
  });
  const workerUrl = URL.createObjectURL(workerFile);
  const fragments = components.get(OBC.FragmentsManager);
  fragments.init(workerUrl);

  world.camera.controls.addEventListener("update", () => fragments.core.update());

  world.onCameraChanged.add((camera) => {
    for (const [, model] of fragments.list) {
      model.useCamera(camera.three);
    }
    fragments.core.update(true);
  });

  fragments.list.onItemSet.add(({ value: model }) => {
    model.useCamera(world.camera.three);
    world.scene.three.add(model.object);
    fragments.core.update(true);
  });

  fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
    if (!("isLodMaterial" in material && material.isLodMaterial)) {
      material.polygonOffset = true;
      material.polygonOffsetUnits = 1;
      material.polygonOffsetFactor = Math.random();
    }
  });

  const fragPaths = [
    "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",
    "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",
  ];

  await Promise.all(
    fragPaths.map(async (path) => {
      const modelId = path.split("/").pop()?.split(".").shift();
      if (!modelId) return null;
      const file = await fetch(path);
      const buffer = await file.arrayBuffer();
      return fragments.core.load(buffer, { modelId });
    }),
  );

  const finder = components.get(OBC.ItemsFinder);

  finder.create("Walls & Slabs", [{ categories: [/WALL/, /SLAB/] }]);

  finder.create("Masonry Walls", [
    {
      categories: [/WALL/],
      attributes: { queries: [{ name: /Name/, value: /Masonry/ }] },
    },
  ]);

  const entryLevel = {
    categories: [/BUILDINGSTOREY/],
    attributes: { queries: [{ name: /Name/, value: /Entry/ }] },
  };

  finder.create("First Level Columns", [
    {
      categories: [/COLUMN/],
      relation: { name: "ContainedInStructure", query: entryLevel },
    },
  ]);

  const getResult = async (name) => {
    const finderQuery = finder.list.get(name);
    if (!finderQuery) return {};
    const result = await finderQuery.test();
    return result;
  };

  BUI.Manager.init();

  const queriesListTemplate = () => {
    const onCreated = (e) => {
      if (!e) return;
      const table = e;

      table.loadFunction = async () => {
        const data = [];

        for (const [name] of finder.list) {
          data.push({ data: { Name: name, Actions: "" } });
        }

        return data;
      };

      table.loadData(true);
    };

    return BUI.html`
      <bim-table ${BUI.ref(onCreated)}></bim-table>
    `;
  };

  const queriesList = BUI.Component.create(queriesListTemplate);

  queriesList.style.maxHeight = "25rem";
  queriesList.columns = ["Name", { name: "Actions", width: "auto" }];
  queriesList.noIndentation = true;
  queriesList.headersHidden = true;
  queriesList.dataTransform = {
    Actions: (_, rowData) => {
      const { Name } = rowData;
      if (!Name) return _;

      const hider = components.get(OBC.Hider);
      const onClick = async ({ target }) => {
        target.loading = true;
        const modelIdMap = await getResult(Name);
        await hider.isolate(modelIdMap);
        target.loading = false;
      };

      return BUI.html`<bim-button icon="solar:cursor-bold" @click=${onClick}></bim-button>`;
    },
  };

  const panel = BUI.Component.create(() => {
    const onResetVisibility = async ({ target }) => {
      target.loading = true;
      const hider = components.get(OBC.Hider);
      await hider.set(true);
      target.loading = false;
    };

    return BUI.html`
      <bim-panel active label="Items Finder Tutorial" class="options-menu">
        <bim-panel-section style="min-width: 14rem" label="General">
          <bim-button label="Reset Visibility" @click=${onResetVisibility}></bim-button>
        </bim-panel-section>
        <bim-panel-section label="Queries">
          ${queriesList}
        </bim-panel-section>
      </bim-panel>
    `;
  });

  document.body.append(panel);

  const button = BUI.Component.create(() => {
    return BUI.html`
        <bim-button class="phone-menu-toggler" icon="solar:settings-bold"
          @click="${() => {
            if (panel.classList.contains("options-menu-visible")) {
              panel.classList.remove("options-menu-visible");
            } else {
              panel.classList.add("options-menu-visible");
            }
          }}">
        </bim-button>
      `;
  });

  document.body.append(button);

  const Stats = window.Stats;
  const stats = new Stats();
  stats.showPanel(2);
  document.body.append(stats.dom);
  stats.dom.style.left = "0px";
  stats.dom.style.zIndex = "unset";
  world.renderer.onBeforeUpdate.add(() => stats.begin());
  world.renderer.onAfterUpdate.add(() => stats.end());

  console.log('ThatOpen Items Finder example initialized');
})();
