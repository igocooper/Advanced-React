import { mount } from "enzyme";
import wait from "waait";
import PleaseSignIn from "../components/PleaseSignIn";
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

describe("<PleaseSignIn />", () => {
  it("renders loading while checkin user status", () => {
    const wrapper = mount(
      <MockedProvider mocks={notSignedInMocks}>
        <PleaseSignIn />
      </MockedProvider>
    );

    expect(wrapper.text()).toContain("Loading...");
  });

  it("renders a signin dialog to logged out users", async () => {
    const wrapper = mount(
      <MockedProvider mocks={notSignedInMocks}>
        <PleaseSignIn />
      </MockedProvider>
    );

    await wait();
    wrapper.update();

    expect(wrapper.text()).toContain('Please "Sign In" before continuing...');
    expect(wrapper.find("Signin").exists()).toBe(true);
  });

  it("renders a child component when user is loged in", async () => {
    const LoginApp = () => <p>I'm loged in</p>;
    const wrapper = mount(
      <MockedProvider mocks={signedInMocks}>
        <PleaseSignIn>
          <LoginApp />
        </PleaseSignIn>
      </MockedProvider>
    );

    await wait();
    wrapper.update();

    expect(wrapper.find("LoginApp").exists()).toBe(true);
  });

});
