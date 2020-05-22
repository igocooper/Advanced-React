import { mount } from "enzyme";
import toJSON from "enzyme-to-json";
import wait from "waait";
import Nav from "../components/Nav";
import { CURRENT_USER_QUERY } from "../components/User";
import { MockedProvider } from "react-apollo/test-utils";
import { fakeUser } from "../lib/testUtils";

const notSignedInMocks = [
  {
    // when some one fetch data with this query and variables comboe
    request: { query: CURRENT_USER_QUERY },
    // then return this fake data (mocked data)
    result: {
      data: {
        me: null,
      },
    },
  },
];

const signedInMocks = [
  {
    // when some one fetch data with this query and variables comboe
    request: { query: CURRENT_USER_QUERY },
    // then return this fake data (mocked data)
    result: {
      data: {
        me: fakeUser(),
      },
    },
  },
];

describe("<Nav />", () => {
  it("renders a minimal nav when signed out", () => {
    const wrapper = mount(
      <MockedProvider mocks={notSignedInMocks}>
        <Nav />
      </MockedProvider>
    );

    await wait();
    wrapper.update();

    const Nav = wraper.find('[data-test="nav"]');

    expect(toJSON(Nav)).toMatchSnapshot();
  });

});
