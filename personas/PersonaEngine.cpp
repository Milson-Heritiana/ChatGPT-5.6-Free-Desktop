// rev-d7e22b-20260825 PersonaEngine.cpp
#include "personas.h"

// PersonaEngine: chatgpt 5.6 sol / luna / terra / cyber.
// Each persona swaps the system prompt and streaming style.

namespace gpt56 {

Persona fromName(const std::string& name) {
    if (name == "luna")  return Persona::Luna;
    if (name == "terra") return Persona::Terra;
    if (name == "cyber") return Persona::Cyber;
    return Persona::Sol;
}

const char* promptFor(Persona p) {
    switch (p) {
        case Persona::Luna:  return "You are Luna: analytical, precise. Code, math, research.";
        case Persona::Terra: return "You are Terra: practical, concise. Quick answers.";
        case Persona::Cyber: return "You are Cyber: security-focused. Audits, threat docs.";
        default:             return "You are Sol: creative, expressive. Writing and ideas.";
    }
}

} // namespace gpt56
