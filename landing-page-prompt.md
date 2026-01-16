# Prompt: Criar Landing Page para Resumefy

## Objetivo
Criar uma landing page moderna, animada e atraente para o **Resumefy** - um sistema SaaS que gera resumos inteligentes de conversas de grupos do WhatsApp usando IA.

---

## Sobre o Resumefy

### O que é?
Resumefy é um assistente de IA que se conecta aos seus grupos do WhatsApp e gera resumos automáticos das conversas. Sabe aquele grupo da família que tem 847 mensagens não lidas? Ou o grupo do trabalho que você ignorou por 3 dias? O Resumefy lê tudo e te entrega um resumo direto ao ponto.

### Principais Funcionalidades

1. **Resumos Automáticos com IA**
   - Conecte seus grupos do WhatsApp
   - A IA analisa as mensagens e gera resumos inteligentes
   - Você fica por dentro de tudo sem ler 500 mensagens sobre "bom dia"

2. **IA Pública vs IA Oculta**
   - **IA Pública**: Os resumos são enviados diretamente no grupo para todos verem
   - **IA Oculta**: Os resumos ficam só para você, no painel privado

3. **ResumeChat**
   - Chat direto com a IA para tirar dúvidas
   - Pergunte qualquer coisa sobre suas conversas ou peça ajuda

4. **ResumeCoins**
   - Sistema de créditos para gerar resumos
   - Cada grupo recebe 105 ResumeCoins por mês
   - Renovação automática mensal

5. **Dashboard Completo**
   - Visualize todos os seus grupos conectados
   - Acompanhe uso de ResumeCoins
   - Configure horários de resumos automáticos

### Público-Alvo
- Profissionais ocupados que participam de muitos grupos
- Gestores que precisam acompanhar equipes remotas
- Qualquer pessoa cansada de abrir o WhatsApp e ver "1.247 mensagens não lidas"

### Preço
- **R$ 197** - Pagamento único
- Inclui: até 3 grupos, 315 ResumeCoins (105 por grupo), IA Premium, Automação completa

---

## Tom e Voz da Marca

O Resumefy é **natural, direto e ocasionalmente engraçado**. A comunicação deve ser:

- **Informal mas profissional** - Como um amigo que manja de tecnologia
- **Bem-humorada** - Piadas sutis sobre a realidade de grupos de WhatsApp
- **Empática** - Entende a dor de ter 47 grupos e zero paciência
- **Direta** - Sem enrolação corporativa, vai direto ao ponto

### Exemplos de Copy no Tom Certo:

**Ruim (corporativo demais):**
> "Nossa solução de inteligência artificial oferece sumarização automatizada de conversas em tempo real."

**Bom (tom Resumefy):**
> "Aquele grupo do trabalho com 300 mensagens? A IA lê pra você e te conta o que importa. Spoiler: provavelmente era sobre o café que acabou."

**Ruim:**
> "Maximize sua produtividade com nossa plataforma de gestão de comunicação."

**Bom:**
> "Você tem mais o que fazer do que ler 'kkkkk' 47 vezes seguidas. Deixa que a gente resume."

---

## Requisitos Técnicos

### Stack Obrigatória
- **React** com TypeScript
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes base
- **Framer Motion** para animações
- **React Three Fiber** (opcional, para efeitos 3D)

### Componentes Fornecidos

Você tem acesso a dois componentes prontos que DEVEM ser utilizados:

#### 1. DotShaderBackground
Background animado com efeito de partículas/dots usando shaders WebGL.

```tsx
"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface DotShaderBackgroundProps {
  dotColor?: string;
  dotSize?: number;
  speed?: number;
  waveIntensity?: number;
  backgroundColor?: string;
  interactionRadius?: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uWaveIntensity;
  uniform vec2 uMouse;
  uniform float uInteractionRadius;

  attribute float aScale;
  attribute float aPhase;

  varying float vScale;
  varying float vDistanceFromMouse;

  void main() {
    vec3 pos = position;

    // Wave animation
    float wave = sin(pos.x * 0.5 + uTime) * cos(pos.y * 0.5 + uTime * 0.8) * uWaveIntensity;
    pos.z += wave;

    // Mouse interaction - calculate distance in 2D
    vec2 mousePos = uMouse * 10.0; // Scale mouse position to match grid
    float distFromMouse = distance(pos.xy, mousePos);
    vDistanceFromMouse = distFromMouse;

    // Push dots away from mouse
    if (distFromMouse < uInteractionRadius) {
      float pushStrength = (1.0 - distFromMouse / uInteractionRadius) * 2.0;
      vec2 pushDir = normalize(pos.xy - mousePos);
      pos.xy += pushDir * pushStrength;
      pos.z += pushStrength * 0.5;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Dynamic scale based on wave and mouse
    float dynamicScale = aScale * (1.0 + wave * 0.3);
    if (distFromMouse < uInteractionRadius) {
      dynamicScale *= 1.0 + (1.0 - distFromMouse / uInteractionRadius) * 0.5;
    }

    gl_PointSize = dynamicScale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vScale = dynamicScale;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uInteractionRadius;

  varying float vScale;
  varying float vDistanceFromMouse;

  void main() {
    float distFromCenter = length(gl_PointCoord - vec2(0.5));
    if (distFromCenter > 0.5) discard;

    // Smooth circle with soft edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, distFromCenter);

    // Brighten dots near mouse
    vec3 color = uColor;
    if (vDistanceFromMouse < uInteractionRadius) {
      float brightness = 1.0 + (1.0 - vDistanceFromMouse / uInteractionRadius) * 0.8;
      color *= brightness;
    }

    gl_FragColor = vec4(color, alpha * 0.8);
  }
`;

function DotGrid({
  dotColor = "#6366f1",
  dotSize = 1.5,
  speed = 0.5,
  waveIntensity = 0.3,
  interactionRadius = 3,
}: Omit<DotShaderBackgroundProps, "backgroundColor">) {
  const meshRef = useRef<THREE.Points>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const { viewport } = useThree();

  const { positions, scales, phases } = useMemo(() => {
    const gridSize = 40;
    const spacing = 0.5;
    const positions: number[] = [];
    const scales: number[] = [];
    const phases: number[] = [];

    for (let x = -gridSize / 2; x < gridSize / 2; x++) {
      for (let y = -gridSize / 2; y < gridSize / 2; y++) {
        positions.push(x * spacing, y * spacing, 0);
        scales.push(dotSize * (0.8 + Math.random() * 0.4));
        phases.push(Math.random() * Math.PI * 2);
      }
    }

    return {
      positions: new Float32Array(positions),
      scales: new Float32Array(scales),
      phases: new Float32Array(phases),
    };
  }, [dotSize]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(dotColor) },
      uWaveIntensity: { value: waveIntensity },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uInteractionRadius: { value: interactionRadius },
    }),
    [dotColor, waveIntensity, interactionRadius]
  );

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime * speed;
      material.uniforms.uMouse.value.lerp(mouseRef.current, 0.1);
    }
  });

  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.set(x * viewport.width * 0.5, y * viewport.height * 0.5);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [viewport]);

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={scales.length}
          array={scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={phases.length}
          array={phases}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

export default function DotShaderBackground({
  dotColor = "#6366f1",
  dotSize = 1.5,
  speed = 0.5,
  waveIntensity = 0.3,
  backgroundColor = "#030712",
  interactionRadius = 3,
}: DotShaderBackgroundProps) {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{ backgroundColor }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <DotGrid
          dotColor={dotColor}
          dotSize={dotSize}
          speed={speed}
          waveIntensity={waveIntensity}
          interactionRadius={interactionRadius}
        />
      </Canvas>
    </div>
  );
}
```

#### 2. AnimatedHero
Hero section com animações elegantes usando Framer Motion.

```tsx
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles, Zap, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
};

const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const pulseVariants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

interface AnimatedHeroProps {
  badge?: string;
  title: string;
  highlightedText?: string;
  description: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  features?: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
  className?: string;
}

export default function AnimatedHero({
  badge = "Novo",
  title,
  highlightedText,
  description,
  primaryCTA = { text: "Comece agora", href: "#" },
  secondaryCTA,
  features,
  className,
}: AnimatedHeroProps) {
  const defaultFeatures = [
    { icon: <Zap className="w-4 h-4" />, text: "Ultra rápido" },
    { icon: <Shield className="w-4 h-4" />, text: "Seguro" },
    { icon: <Globe className="w-4 h-4" />, text: "Global" },
  ];

  const displayFeatures = features || defaultFeatures;

  return (
    <section
      className={cn(
        "relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden",
        className
      )}
    >
      {/* Ambient glow effects */}
      <motion.div
        variants={pulseVariants}
        initial="initial"
        animate="animate"
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10"
      />
      <motion.div
        variants={pulseVariants}
        initial="initial"
        animate="animate"
        style={{ animationDelay: "1.5s" }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] -z-10"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto text-center"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary"
          >
            <Sparkles className="w-4 h-4" />
            {badge}
          </motion.span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
        >
          {title}{" "}
          {highlightedText && (
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                {highlightedText}
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                className="absolute bottom-2 left-0 right-0 h-3 bg-primary/20 -z-10 origin-left"
              />
            </span>
          )}
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          {description}
        </motion.p>

        {/* Features pills */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {displayFeatures.map((feature, index) => (
            <motion.div
              key={index}
              variants={floatVariants}
              initial="initial"
              animate="animate"
              style={{ animationDelay: `${index * 0.5}s` }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border text-sm"
            >
              {feature.icon}
              <span>{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button size="lg" className="group text-base px-8" asChild>
              <a href={primaryCTA.href}>
                {primaryCTA.text}
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </motion.div>
          {secondaryCTA && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8"
                asChild
              >
                <a href={secondaryCTA.href}>{secondaryCTA.text}</a>
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Stats or social proof */}
        <motion.div
          variants={itemVariants}
          className="mt-16 pt-8 border-t border-border/50"
        >
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            {[
              { value: "10K+", label: "Usuários" },
              { value: "1M+", label: "Resumos gerados" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 + index * 0.2, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
```

---

## Estrutura da Landing Page

A landing page deve conter as seguintes seções:

### 1. Hero Section
- Usar o componente `DotShaderBackground` como background
- Usar o componente `AnimatedHero` com copy personalizada
- Headline principal chamativa
- Subheadline explicando o valor
- CTA principal: "Começar Agora" ou similar
- CTA secundário: "Ver Demo" ou "Como Funciona"

### 2. Problema / Dor
- Seção que fala sobre o problema que o Resumefy resolve
- Exemplos de situações do dia a dia (grupos lotados, mensagens não lidas)
- Tom empático e levemente humorado

### 3. Como Funciona
- 3-4 passos simples explicando o fluxo
- Ícones ou ilustrações para cada passo
- Animações sutis ao scroll

### 4. Features / Benefícios
- Cards ou grid com as principais funcionalidades
- IA Pública vs IA Oculta
- ResumeChat
- Dashboard
- Automação

### 5. Preços
- Card único destacado com o preço (R$ 197)
- Lista de tudo que está incluído
- CTA para assinar

### 6. FAQ
- Perguntas frequentes em formato accordion
- Respostas claras e diretas

### 7. CTA Final
- Seção de fechamento com call-to-action forte
- Reforçar proposta de valor

### 8. Footer
- Links úteis
- Redes sociais (se houver)
- Copyright

---

## Paleta de Cores Sugerida

O sistema atual usa um tema dark/cyber com verde como cor primária. Sugiro manter a consistência:

```css
/* Cores principais */
--background: #030712;      /* Quase preto */
--foreground: #f8fafc;      /* Branco suave */
--primary: #10b981;         /* Verde esmeralda */
--primary-foreground: #030712;
--secondary: #1e293b;       /* Cinza azulado escuro */
--muted: #334155;           /* Cinza médio */
--accent: #6366f1;          /* Indigo para destaques */
```

---

## Diretrizes de Copy

### Headlines que funcionam:

- "Seus grupos de WhatsApp. Resumidos pela IA."
- "Pare de ler 500 mensagens. Leia só o que importa."
- "A IA que lê o grupo pra você (e não reclama)"
- "WhatsApp + IA = Paz de espírito"

### Subheadlines:

- "Conecte seus grupos e receba resumos automáticos. Simples assim."
- "Enquanto você trabalha, a IA acompanha a conversa. Sem perder nenhum 'kkkkk' importante."

### Microcopy para botões:

- "Quero meu resumo" (ao invés de "Assinar")
- "Ver como funciona"
- "Testar agora"

### Para a seção de problema:

> **"Você conhece essa sensação."**
>
> Você abre o WhatsApp. 847 mensagens não lidas no grupo da família.
> 312 no grupo do trabalho. 156 no grupo da faculdade que você jurou que ia sair.
>
> Você tem duas opções: ler tudo (RIP sua tarde) ou marcar como lido e torcer pra não ter perdido nada importante (spoiler: sempre tem algo importante).
>
> **Ou... você pode deixar o Resumefy fazer isso por você.**

---

## Dependências Necessárias

```bash
npm install @react-three/fiber @react-three/drei three framer-motion lucide-react
npm install @radix-ui/react-accordion @radix-ui/react-dialog # e outros do shadcn
```

---

## Checklist Final

Antes de entregar, verifique:

- [ ] Background animado funcionando (DotShaderBackground)
- [ ] Hero com animações (AnimatedHero)
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Performance OK (sem lag nas animações)
- [ ] Copy revisada e no tom certo
- [ ] CTAs levando para o lugar certo
- [ ] Acessibilidade básica (contraste, alt texts)
- [ ] SEO básico (title, description, og tags)

---

## Exemplo de Uso dos Componentes

```tsx
import DotShaderBackground from "@/components/ui/dot-shader-background";
import AnimatedHero from "@/components/ui/animated-hero";
import { MessageSquare, Zap, Shield, Bot } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative">
      <DotShaderBackground
        dotColor="#10b981"
        backgroundColor="#030712"
        speed={0.3}
        waveIntensity={0.2}
      />

      <AnimatedHero
        badge="Novo: IA ainda mais inteligente"
        title="Seus grupos de WhatsApp."
        highlightedText="Resumidos."
        description="Conecte seus grupos e receba resumos automáticos feitos por IA. Nunca mais perca uma informação importante (nem tenha que ler 500 'bom dia')."
        primaryCTA={{ text: "Começar agora", href: "/auth/register" }}
        secondaryCTA={{ text: "Ver como funciona", href: "#como-funciona" }}
        features={[
          { icon: <Bot className="w-4 h-4" />, text: "IA Premium" },
          { icon: <Zap className="w-4 h-4" />, text: "Resumos automáticos" },
          { icon: <MessageSquare className="w-4 h-4" />, text: "ResumeChat" },
        ]}
      />

      {/* Outras seções... */}
    </div>
  );
}
```

---

## Notas Importantes

1. **Mantenha a consistência** com o design system existente (cores, tipografia, espaçamentos)
2. **Performance** é crítica - use lazy loading para componentes pesados
3. **Mobile first** - a maioria dos usuários de WhatsApp são mobile
4. **O tom é tudo** - a landing page deve parecer amigável, não corporativa
5. **Não exagere nas animações** - devem ser sutis e não distrair do conteúdo

---

*Prompt criado para o projeto Resumefy - Janeiro 2026*
