{/* Browser Animation */}
      <motion.div 
        className="relative w-full max-w-4xl mx-auto mb-12 rounded-lg overflow-hidden bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* Browser Header */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-4 bg-zinc-50 border-b border-zinc-200">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57] max-sm:w-[0.5rem] max-sm:h-[0.5rem]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] max-sm:w-[0.5rem] max-sm:h-[0.5rem]"></div>
              <div className="w-3 h-3 rounded-full bg-[#28C840] max-sm:w-[0.5rem] max-sm:h-[0.5rem]"></div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-full bg-zinc-100 text-zinc-600 text-sm max-sm:text-[0.8rem]">
                naotemchef.com.br
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full "></div>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200">
          <Image 
                src="https://naotemchef.com.br/homepage/logo.svg"
                alt="Não Tem Chef Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            <div className="flex items-center gap-4">
              
              <nav className="flex gap-6 text-sm">
                <a href="#" className="text-zinc-600 hover:text-zinc-900 max-sm:text-[0.7rem]">Feed</a>
                <a href="#" className="text-zinc-600 hover:text-zinc-900 max-sm:text-[0.7rem]">Meus cupons</a>
                <a href="#" className="text-zinc-600 hover:text-zinc-900 max-sm:text-[0.7rem]">Perfil</a>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
                <Bell size={20} className="text-zinc-600 hover:text-zinc-900" />
              <div className="w-10 h-10 rounded-full bg-zinc-200"><Avatar><AvatarFallback className="font-bold text-sm">LC</AvatarFallback></Avatar></div>
            </div>
          </div>
        </div>

      
        {/* Browser Content */}
        <div className="relative h-[400px] flex">
          {/* Main Content */}
          <motion.div 
            className="flex-1 p-6 grid grid-cols-3 gap-4 bg-zinc-100"
            animate={{ 
              x: [0, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            {listvouchers.map((listvouchers) => (
              <motion.div
                key={listvouchers.name}
                className="bg-white rounded-lg overflow-hidden shadow-md border border-zinc-100"
              >
                <div className="relative w-full h-24">
                  <Image
                    src={listvouchers.image}
                    alt=""
                    fill
                    className="object-cover"
                  />
                  <div className="flex flex-1 absolute top-2 right-2 bg-black/80 text-white text-xs px-1 py-1 rounded-full max-sm:text-[0.6rem]">
                    <span>⭐{listvouchers.rating}</span>
                    <div className="bg-red-500 text-white px-1 ml-1 text-xs rounded-full max-sm:text-[0.6rem]">20% OFF</div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-zinc-800 font-semibold text-sm max-sm:text-[0.7rem]">{listvouchers.name}</h3>
                  <p className="text-zinc-500 text-xs max-sm:text-[10px] max-sm:text-[0.6rem]">{listvouchers.category}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="absolute right-0 top-0 w-[250px] h-full bg-white border-l-2 border-zinc-200"
            animate={{ 
              x: [100, 0],
              opacity: [0, 1],
            }}
            transition={{
              duration: 1,
              ease: "easeInOut",
              repeatDelay: 5 // Adiciona um delay de 5 segundos entre cada repetição
            }}

          >
            <div className="p-6">
              <div className="relative h-32 rounded-lg overflow-hidden mb-4">
                <Image
                  src="https://naotemchef.com.br/homepage/restaurantes/image-3.jpg"
                  alt="Restaurante em destaque"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 bg-[#4CAF50] text-white text-sm px-2 py-1 rounded">
                  20% OFF
                </div>
              </div>
              <div className="space-y-2 w-full space-y-4">
                <div className="flex flex-col">
                  <h3 className="text-zinc-800 font-semibold text-lg max-sm:text-[1rem]">Bistrot de Paris</h3>
                  <span className="max-sm:text-[1rem] text-green-500 font-bold line-height-1">20% de desconto de segunda a sexta</span>
                </div>
                
                <div className="flex flex-row items-center gap-1 text-zinc-500 text-sm max-sm:text-[0.8rem]">
                  <span className="max-sm:text-[0.8rem]">⭐4.8</span>
                  <span>•</span>
                  <span className="max-sm:text-[0.6rem]">Valido para qualquer prato</span>
                </div>

                <div className="space-y-2">
                  {showVoucher ? (
                    <div className="text-center bg-zinc-100 p-2 rounded-lg">
                      <p className="text-zinc-600 max-sm:text-[0.8rem]">Seu voucher foi gerado</p>
                      <p className="text-xl font-bold text-violet-500">{voucherCode}</p>
                    </div>
                  ) : (
                    <motion.button 
                      className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 px-4 rounded-lg transition-colors"
                      animate={{ scale: [1, 0.95, 1] }}
                      transition={{
                        duration: 0.5,
                        ease: "easeInOut"
                      }}
                      onAnimationComplete={async () => {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        setShowVoucher(true);
                        setVoucherCode(generateVoucherCode());
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        setShowVoucher(false);
                        setVoucherCode("");
                      }}
                    >
                      Gerar voucher
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>