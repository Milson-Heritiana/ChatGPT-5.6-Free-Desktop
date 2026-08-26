// rev-d7e22b-20260825 App.cpp
#include "../stream/App.h"
#include "../personas/personas.h"
#include <fstream>

namespace gpt56 {

bool App::init(const std::string& cfgPath) {
    std::ifstream f(cfgPath);
    return (bool)f;
}

void App::setPersona(Persona p) {
    persona_ = p;
    session_.setSystemPrompt(promptFor(p));
    accent_ = accentFor(p);
}

void App::setContextWindow(size_t tokens) { (void)tokens; }

int App::run() {
    return 0;
}

} // namespace gpt56
