import { createFeatureStateSelector, createFeatureStore, createSelector, FeatureStore } from 'mini-rx-store'
import { firstValueFrom, Observable } from 'rxjs';
import { error } from '../../src/logging';



describe("mini-rx-store Tests", () => {

  before(() => {
    assert.isFunction(createFeatureStateSelector, "createFeatureStateSelector");
    assert.isFunction(createFeatureStore, "createFeatureStore");
    assert.isFunction(createSelector, "createSelector");
    assert.isFunction(FeatureStore, "FeatureStore");
    assert.isFunction(Observable, "Observable");
    assert.isFunction(firstValueFrom, "firstValueFrom");
  });

  context("Feature Store", () => {
    let store: FeatureStore<FeatureState> | null = null;

    interface FeatureState {
      string?: string;
      number?: number;
      boolean?: boolean;
    }

    it("can create a feature store", () => {
      store = createFeatureStore<FeatureState>("tests", { string: "string", number: 0, boolean: true });
      assert.exists(store, "Store");
      assert.instanceOf(store, FeatureStore);
    });

    const featureSelector = createFeatureStateSelector<FeatureState>();
    it("can create feature selector", () => {
      assert.isFunction(featureSelector);
    });

    describe("can manipulate feature state", () => {


      it("can manipulate string state", async () => {
        const stringSelector = createSelector(featureSelector, state => state.string);
        assert.isFunction(stringSelector, "stringSelector");
        let val: string | boolean | number = await firstValueFrom(store.select(stringSelector));
        assert.isString(val);
        assert.equal(val, "string");


        store.setState({ string: "test" });
        val = await firstValueFrom(store.select(stringSelector));
        assert.isString(val);
        assert.equal(val, "test");
      });

      it("can manipulate numerical state", async () => {
        const numberSelector = createSelector(featureSelector, state => state.number);
        assert.isFunction(numberSelector, "numberSelector");
        let val = await firstValueFrom(store.select(numberSelector));
        assert.isNumber(val);
        assert.equal(val, 0);

        store.setState({ number: 10 });
        val = await firstValueFrom(store.select(numberSelector));
        assert.isNumber(val);
        assert.equal(val, 10);
      })

      it("can manipulate boolean state", async () => {
        const booleanSelector = createSelector(featureSelector, state => state.boolean);
        assert.isFunction(booleanSelector, "booleanSelector");
        let val = await firstValueFrom(store.select(booleanSelector));
        assert.isBoolean(val);
        assert.isTrue(val);

        store.setState({ boolean: false });
        val = await firstValueFrom(store.select(booleanSelector));
        assert.isBoolean(val);
        assert.isFalse(val);
      })
    });
  });
});