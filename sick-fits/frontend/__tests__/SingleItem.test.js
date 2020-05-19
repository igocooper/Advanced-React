import { mount } from "enzyme";
import toJSON from "enzyme-to-json";
import wait from "waait";
import SingleItem, { SINGLE_ITEM_QUERY } from "../components/SingleItem";
import { MockedProvider } from "react-apollo/test-utils";
import { fakeItem } from "../lib/testUtils";

describe("<SingleItem />", () => {
  const singleItemId = "123";
  it("renderes with proper data", async () => {
    const mocks = [
      {
        // when some one fetch data with this query and variables comboe
        request: { query: SINGLE_ITEM_QUERY, variables: { id: singleItemId } },
        // then return this fake data (mocked data)
        result: {
          data: {
            item: fakeItem,
          },
        },
      },
    ];
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <SingleItem id={singleItemId} />
      </MockedProvider>
    );

    expect(wrapper.text()).toContain("Loading...");

    // wait for query to resolve
    await wait();
    // update component state
    wrapper.update();

    expect(toJSON(wrapper.find("h2"))).toMatchSnapshot();
    expect(toJSON(wrapper.find("img"))).toMatchSnapshot();
    expect(toJSON(wrapper.find("p"))).toMatchSnapshot();
  });

  it("Errors with not found item", async () => {
    const mocks = [
      {
        // when some one fetch data with this query and variables comboe
        request: { query: SINGLE_ITEM_QUERY, variables: { id: singleItemId } },
        // then return this fake data (mocked data)
        result: {
          errors: [{ message: "No item found!" }],
        },
      },
    ];

    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <SingleItem id={singleItemId} />
      </MockedProvider>
    );

    await wait();
    wrapper.update();
    const item = wrapper.find('[data-test="graphql-error"]');
    expect(item.text()).toContain('No item found!');
    expect(toJSON(item)).toMatchSnapshot();
  });
});
