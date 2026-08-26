// rev-d7e22b-20260825 main.cpp
#include "../stream/App.h"
#include "../personas/personas.h"
#include <iostream>

// ChatGPT 5.6 Free Desktop — free gpt 5.6 client, MIT, no Plus paywall.

int main(int argc, char** argv) {
    gpt56::App app;
    if (!app.init("docs/settings.json")) {
        std::cerr << "[gpt-5.6] init failed\n";
        return 1;
    }

    app.setPersona(gpt56::Persona::Sol);
    app.setContextWindow(200000);

    if (argc > 2 && std::string(argv[1]) == "--persona")
        app.setPersona(gpt56::fromName(argv[2]));

    return app.run();
}
